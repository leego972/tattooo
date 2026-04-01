// MAILING SYSTEM DISABLED
// All functions replaced with no-op stubs that return true/void to prevent breaking app flows.

export async function sendPasswordResetEmail(toEmail: string, toName: string | null, resetUrl: string): Promise<void> {
  console.log(`[DISABLED] sendPasswordResetEmail to ${toEmail}`);
}

export async function sendArtistContactEmail(opts: any): Promise<void> {
  console.log(`[DISABLED] sendArtistContactEmail to ${opts.artistEmail}`);
}

export async function sendWelcomeEmail(toEmail: string, toName: string | null): Promise<void> {
  console.log(`[DISABLED] sendWelcomeEmail to ${toEmail}`);
}

export async function sendOutreachEmail(opts: any): Promise<void> {
  console.log(`[DISABLED] sendOutreachEmail to ${opts.to}`);
}

export async function sendArtistRegistrationConfirmation(toEmail: string, toName: string | null): Promise<void> {
  console.log(`[DISABLED] sendArtistRegistrationConfirmation to ${toEmail}`);
}

export async function sendPromoConfirmationEmail(toEmail: string, toName: string | null, promoCode: string, discountPercent?: number, bonusCredits?: number): Promise<void> {
  console.log(`[DISABLED] sendPromoConfirmationEmail to ${toEmail}`);
}

export async function sendLowCreditAlert(toEmail: string, toName: string | null, remainingCredits: number): Promise<void> {
  console.log(`[DISABLED] sendLowCreditAlert to ${toEmail}`);
}

export async function sendArtistTeamInviteEmail(toEmail: string, studioName: string, inviteUrl: string, inviterName?: string): Promise<void> {
  console.log(`[DISABLED] sendArtistTeamInviteEmail to ${toEmail}`);
}

export async function sendDesignToArtistEmail(opts: any): Promise<void> {
  console.log(`[DISABLED] sendDesignToArtistEmail to ${opts.artistEmail}`);
}

export async function sendBookingNotificationEmail(opts: any): Promise<void> {
  console.log(`[DISABLED] sendBookingNotificationEmail to ${opts.to}`);
}
