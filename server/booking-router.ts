import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import {
  bookings,
  artists,
  users,
  artistAvailability,
  inAppNotifications,
} from "../drizzle/schema";
import { eq, and, desc, asc, isNull, ne, or } from "drizzle-orm";
import { sendBookingNotificationEmail } from "./emailService";

// ── Helper: create in-app notification ───────────────────────────────────────
async function createNotification(params: {
  userId: number;
  type: "booking_request" | "booking_confirmed" | "booking_declined" | "booking_cancelled" | "new_message" | "system";
  title: string;
  message: string;
  data?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(inAppNotifications).values({
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    data: params.data ? JSON.stringify(params.data) : null,
    isRead: false,
  });
}

// ── Bookings Router ───────────────────────────────────────────────────────────
export const bookingRouter = router({

  // User: request a booking with an artist
  request: protectedProcedure
    .input(z.object({
      artistId: z.number().int().positive(),
      generationId: z.number().int().positive().optional(),
      preferredDate: z.string().optional(), // YYYY-MM-DD
      customerPhone: z.string().max(64).optional(),
      notes: z.string().max(1000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const artistRows = await db.select().from(artists).where(eq(artists.id, input.artistId)).limit(1);
      const artist = artistRows[0];
      if (!artist) throw new TRPCError({ code: "NOT_FOUND", message: "Artist not found." });

      const [booking] = await db.insert(bookings).values({
        customerId: ctx.user.id,
        artistId: input.artistId,
        tattooGenerationId: input.generationId,
        status: "pending",
        preferredDate: input.preferredDate,
        customerPhone: input.customerPhone,
        customerNotes: input.notes,
        message: input.notes,
      });

      const bookingId = (booking as { insertId: number }).insertId;

      // Notify artist
      const artistUserRows = await db.select().from(users).where(eq(users.id, artist.userId!)).limit(1);
      if (artistUserRows[0]) {
        await createNotification({
          userId: artistUserRows[0].id,
          type: "booking_request",
          title: "🔔 New Booking Request!",
          message: `${ctx.user.name || "A customer"} wants to book an appointment${input.preferredDate ? ` on ${input.preferredDate}` : ""}. Tap to review.`,
          data: { bookingId, customerId: ctx.user.id, customerName: ctx.user.name, preferredDate: input.preferredDate },
        });

        // Email artist
        if (artist.contactEmail) {
          await sendBookingNotificationEmail({
            to: artist.contactEmail,
            toName: artist.name,
            type: "new_request",
            customerName: ctx.user.name || "A customer",
            customerEmail: ctx.user.email || "",
            customerPhone: input.customerPhone,
            preferredDate: input.preferredDate,
            notes: input.notes,
            bookingId,
          }).catch(() => {}); // non-fatal
        }
      }

      return { success: true, bookingId };
    }),

  // Artist: confirm a booking
  confirm: protectedProcedure
    .input(z.object({
      bookingId: z.number().int().positive(),
      confirmedDate: z.string().optional(), // YYYY-MM-DD
      confirmedTime: z.string().optional(), // HH:MM
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const bookingRows = await db.select().from(bookings).where(eq(bookings.id, input.bookingId)).limit(1);
      const booking = bookingRows[0];
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });

      // Verify caller is the artist
      const artistRows = await db.select().from(artists).where(eq(artists.userId, ctx.user.id)).limit(1);
      const artist = artistRows[0];
      if (!artist || artist.id !== booking.artistId) throw new TRPCError({ code: "FORBIDDEN" });

      const confirmedAt = input.confirmedDate
        ? new Date(`${input.confirmedDate}T${input.confirmedTime || "10:00"}:00`)
        : new Date();

      await db.update(bookings).set({
        status: "confirmed",
        scheduledAt: confirmedAt,
      }).where(eq(bookings.id, input.bookingId));

      // Mark availability slot as booked
      if (input.confirmedDate) {
        await db.update(artistAvailability)
          .set({ isBooked: true, bookingId: input.bookingId })
          .where(and(
            eq(artistAvailability.artistId, artist.id),
            eq(artistAvailability.date, input.confirmedDate),
          ));
      }

      // Notify customer
      await createNotification({
        userId: booking.customerId,
        type: "booking_confirmed",
        title: "✅ Booking Confirmed!",
        message: `${artist.name} confirmed your appointment${input.confirmedDate ? ` for ${input.confirmedDate}${input.confirmedTime ? " at " + input.confirmedTime : ""}` : ""}. Get ready!`,
        data: { bookingId: input.bookingId, artistId: artist.id, artistName: artist.name, confirmedDate: input.confirmedDate, confirmedTime: input.confirmedTime },
      });

      // Email customer
      const customerRows = await db.select().from(users).where(eq(users.id, booking.customerId)).limit(1);
      if (customerRows[0]?.email) {
        await sendBookingNotificationEmail({
          to: customerRows[0].email,
          toName: customerRows[0].name || "Customer",
          type: "confirmed",
          artistName: artist.name,
          confirmedDate: input.confirmedDate,
          confirmedTime: input.confirmedTime,
          bookingId: input.bookingId,
        }).catch(() => {});
      }

      return { success: true };
    }),

  // Artist: decline a booking
  decline: protectedProcedure
    .input(z.object({
      bookingId: z.number().int().positive(),
      reason: z.string().max(500).optional(),
      nextAvailableDate: z.string().optional(), // YYYY-MM-DD
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const bookingRows = await db.select().from(bookings).where(eq(bookings.id, input.bookingId)).limit(1);
      const booking = bookingRows[0];
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });

      const artistRows = await db.select().from(artists).where(eq(artists.userId, ctx.user.id)).limit(1);
      const artist = artistRows[0];
      if (!artist || artist.id !== booking.artistId) throw new TRPCError({ code: "FORBIDDEN" });

      await db.update(bookings).set({
        status: "cancelled",
        declineReason: input.reason,
        nextAvailableDate: input.nextAvailableDate,
      }).where(eq(bookings.id, input.bookingId));

      // Find alternative artists in same country
      const alternatives = await db.select({
        id: artists.id,
        name: artists.name,
        city: artists.city,
        country: artists.country,
        specialties: artists.specialties,
        profilePhotoUrl: artists.profilePhotoUrl,
        hourlyRate: artists.hourlyRate,
      }).from(artists).where(
        and(
          eq(artists.verified, true),
          ne(artists.id, artist.id),
          artist.country ? eq(artists.country, artist.country) : undefined,
        )
      ).limit(3);

      // Notify customer
      const declineMsg = input.nextAvailableDate
        ? `${artist.name} is unavailable for your requested date. Their next available date is ${input.nextAvailableDate}. We've found some alternative artists for you too.`
        : `${artist.name} is unable to take your booking right now. We've found some alternative artists nearby.`;

      await createNotification({
        userId: booking.customerId,
        type: "booking_declined",
        title: "📅 Booking Update",
        message: declineMsg,
        data: {
          bookingId: input.bookingId,
          artistId: artist.id,
          artistName: artist.name,
          reason: input.reason,
          nextAvailableDate: input.nextAvailableDate,
          alternatives: alternatives.map((a) => ({ id: a.id, name: a.name, city: a.city, country: a.country })),
        },
      });

      // Email customer
      const customerRows = await db.select().from(users).where(eq(users.id, booking.customerId)).limit(1);
      if (customerRows[0]?.email) {
        await sendBookingNotificationEmail({
          to: customerRows[0].email,
          toName: customerRows[0].name || "Customer",
          type: "declined",
          artistName: artist.name,
          reason: input.reason,
          nextAvailableDate: input.nextAvailableDate,
          alternatives,
          bookingId: input.bookingId,
        }).catch(() => {});
      }

      return { success: true, alternatives };
    }),

  // User: get their bookings
  myBookings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select({
      id: bookings.id,
      status: bookings.status,
      preferredDate: bookings.preferredDate,
      scheduledAt: bookings.scheduledAt,
      customerNotes: bookings.customerNotes,
      declineReason: bookings.declineReason,
      nextAvailableDate: bookings.nextAvailableDate,
      createdAt: bookings.createdAt,
      artistId: artists.id,
      artistName: artists.name,
      artistCity: artists.city,
      artistCountry: artists.country,
      artistPhoto: artists.profilePhotoUrl,
      artistSpecialties: artists.specialties,
    }).from(bookings)
      .leftJoin(artists, eq(bookings.artistId, artists.id))
      .where(eq(bookings.customerId, ctx.user.id))
      .orderBy(desc(bookings.createdAt));
    return rows;
  }),

  // Artist: get their booking inbox
  artistInbox: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const artistRows = await db.select().from(artists).where(eq(artists.userId, ctx.user.id)).limit(1);
    if (!artistRows[0]) return [];
    const artist = artistRows[0];

    const rows = await db.select({
      id: bookings.id,
      status: bookings.status,
      preferredDate: bookings.preferredDate,
      scheduledAt: bookings.scheduledAt,
      customerNotes: bookings.customerNotes,
      customerPhone: bookings.customerPhone,
      createdAt: bookings.createdAt,
      customerId: users.id,
      customerName: users.name,
      customerEmail: users.email,
    }).from(bookings)
      .leftJoin(users, eq(bookings.customerId, users.id))
      .where(eq(bookings.artistId, artist.id))
      .orderBy(desc(bookings.createdAt));
    return rows;
  }),
});

// ── Availability Router ───────────────────────────────────────────────────────
export const availabilityRouter = router({

  // Artist: set available dates (bulk upsert)
  setSlots: protectedProcedure
    .input(z.object({
      slots: z.array(z.object({
        date: z.string(), // YYYY-MM-DD
        timeSlot: z.string().default("all-day"),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const artistRows = await db.select().from(artists).where(eq(artists.userId, ctx.user.id)).limit(1);
      if (!artistRows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Artist profile not found." });
      const artist = artistRows[0];

      // Delete existing unbooked slots for these dates, then re-insert
      for (const slot of input.slots) {
        await db.delete(artistAvailability).where(
          and(
            eq(artistAvailability.artistId, artist.id),
            eq(artistAvailability.date, slot.date),
            eq(artistAvailability.isBooked, false),
          )
        );
        await db.insert(artistAvailability).values({
          artistId: artist.id,
          date: slot.date,
          timeSlot: slot.timeSlot,
          isBooked: false,
        });
      }
      return { success: true, count: input.slots.length };
    }),

  // Artist: remove an available slot
  removeSlot: protectedProcedure
    .input(z.object({ date: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const artistRows = await db.select().from(artists).where(eq(artists.userId, ctx.user.id)).limit(1);
      if (!artistRows[0]) throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(artistAvailability).where(
        and(
          eq(artistAvailability.artistId, artistRows[0].id),
          eq(artistAvailability.date, input.date),
          eq(artistAvailability.isBooked, false),
        )
      );
      return { success: true };
    }),

  // Public: get artist's open slots
  getSlots: publicProcedure
    .input(z.object({ artistId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(artistAvailability)
        .where(and(
          eq(artistAvailability.artistId, input.artistId),
          eq(artistAvailability.isBooked, false),
        ))
        .orderBy(asc(artistAvailability.date));
    }),

  // Artist: get their own slots (including booked)
  mySlots: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const artistRows = await db.select().from(artists).where(eq(artists.userId, ctx.user.id)).limit(1);
    if (!artistRows[0]) return [];
    return db.select().from(artistAvailability)
      .where(eq(artistAvailability.artistId, artistRows[0].id))
      .orderBy(asc(artistAvailability.date));
  }),
});

// ── Notifications Router ──────────────────────────────────────────────────────
export const notificationsRouter = router({

  // Get all notifications for current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(inAppNotifications)
      .where(eq(inAppNotifications.userId, ctx.user.id))
      .orderBy(desc(inAppNotifications.createdAt))
      .limit(50);
  }),

  // Unread count
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { count: 0 };
    const rows = await db.select().from(inAppNotifications)
      .where(and(
        eq(inAppNotifications.userId, ctx.user.id),
        eq(inAppNotifications.isRead, false),
      ));
    return { count: rows.length };
  }),

  // Mark one as read
  markRead: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(inAppNotifications)
        .set({ isRead: true })
        .where(and(eq(inAppNotifications.id, input.id), eq(inAppNotifications.userId, ctx.user.id)));
      return { success: true };
    }),

  // Mark all as read
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(inAppNotifications)
      .set({ isRead: true })
      .where(eq(inAppNotifications.userId, ctx.user.id));
    return { success: true };
  }),
});
