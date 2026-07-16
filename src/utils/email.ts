/**
 * Email Utilities
 * PRD-06: Section 3 — Email Service
 *
 * All transports are invoked only from the email queue worker.
 * Direct callers should use enqueueEmail() instead.
 */

import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

const createTransporter = () =>
  nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER
      ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        }
      : undefined,
  });

const sendMail = async (options: nodemailer.SendMailOptions): Promise<void> => {
  if (!env.SMTP_USER) {
    logger.debug('[DEV] SMTP not configured — email skipped', { to: options.to, subject: options.subject });
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail(options);
};

const baseStyle = `
  font-family: Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  color: #333;
`;

const otpBlock = (otp: string, color = '#4f46e5') =>
  `<div style="background:#f4f4f4;padding:20px;text-align:center;border-radius:8px;margin:20px 0;">
    <h1 style="letter-spacing:8px;color:${color};font-size:36px;">${otp}</h1>
  </div>`;

// ── Email Verification ────────────────────────────────────────────────────────
export const sendVerificationEmail = async (email: string, otp: string): Promise<void> => {
  try {
    await sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Email — CSE Student Platform',
      html: `<div style="${baseStyle}">
        <h2>Email Verification</h2>
        <p>Welcome to CSE Student Platform! Use the OTP below to verify your email.</p>
        ${otpBlock(otp)}
        <p>This OTP expires in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>`,
    });
    logger.info(`Verification email sent`, { to: email });
  } catch (error) {
    logger.error('Failed to send verification email', { error, email });
    throw error;
  }
};

// ── Password Reset ─────────────────────────────────────────────────────────────
export const sendPasswordResetEmail = async (email: string, otp: string): Promise<void> => {
  try {
    await sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset OTP — CSE Student Platform',
      html: `<div style="${baseStyle}">
        <h2>Password Reset</h2>
        <p>You requested to reset your password. Use the OTP below to proceed.</p>
        ${otpBlock(otp, '#ef4444')}
        <p>This OTP expires in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, secure your account immediately.</p>
      </div>`,
    });
    logger.info(`Password reset email sent`, { to: email });
  } catch (error) {
    logger.error('Failed to send password reset email', { error, email });
    throw error;
  }
};

// ── Team Invitation ────────────────────────────────────────────────────────────
export const sendTeamInvitationEmail = async (
  email: string,
  teamName: string,
  senderName: string,
): Promise<void> => {
  try {
    await sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_USER}>`,
      to: email,
      subject: `Team Invitation: ${teamName} — CSE Student Platform`,
      html: `<div style="${baseStyle}">
        <h2>You've Been Invited!</h2>
        <p><strong>${senderName}</strong> has invited you to join the team <strong>${teamName}</strong> on CSE Student Platform.</p>
        <p>Log in to your account to accept or reject the invitation.</p>
        <a href="${env.CLIENT_URL}/teams/invitations" style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">View Invitation</a>
        <p>This invitation will expire in 7 days.</p>
      </div>`,
    });
    logger.info(`Team invitation email sent`, { to: email, teamName });
  } catch (error) {
    logger.error('Failed to send team invitation email', { error, email });
    throw error;
  }
};

// ── Event Registration ──────────────────────────────────────────────────────────
export const sendEventRegistrationEmail = async (
  email: string,
  eventTitle: string,
  eventDate: string,
): Promise<void> => {
  try {
    await sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_USER}>`,
      to: email,
      subject: `Registration Confirmed: ${eventTitle}`,
      html: `<div style="${baseStyle}">
        <h2>Registration Confirmed!</h2>
        <p>You have successfully registered for <strong>${eventTitle}</strong>.</p>
        <div style="background:#f0f9ff;padding:16px;border-radius:8px;margin:16px 0;">
          <p><strong>Event:</strong> ${eventTitle}</p>
          <p><strong>Date:</strong> ${eventDate}</p>
        </div>
        <p>We look forward to seeing you there!</p>
        <a href="${env.CLIENT_URL}/events" style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">View My Events</a>
      </div>`,
    });
    logger.info(`Event registration email sent`, { to: email, eventTitle });
  } catch (error) {
    logger.error('Failed to send event registration email', { error, email });
    throw error;
  }
};

// ── Placement Reminder ──────────────────────────────────────────────────────────
export const sendPlacementReminderEmail = async (
  email: string,
  jobTitle: string,
  companyName: string,
  deadline: string,
): Promise<void> => {
  try {
    await sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_USER}>`,
      to: email,
      subject: `Application Deadline Reminder: ${jobTitle} at ${companyName}`,
      html: `<div style="${baseStyle}">
        <h2>Application Deadline Reminder</h2>
        <p>Don't miss your chance to apply for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
        <div style="background:#fff7ed;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #f59e0b;">
          <p><strong>Deadline:</strong> ${deadline}</p>
        </div>
        <a href="${env.CLIENT_URL}/jobs" style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">View Job</a>
      </div>`,
    });
    logger.info(`Placement reminder email sent`, { to: email, jobTitle, companyName });
  } catch (error) {
    logger.error('Failed to send placement reminder email', { error, email });
    throw error;
  }
};

// ── Weekly Learning Summary ──────────────────────────────────────────────────────
export const sendWeeklyLearningSummaryEmail = async (
  email: string,
  userName: string,
  lessonsCompleted: number,
  minutesStudied: number,
): Promise<void> => {
  try {
    await sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_USER}>`,
      to: email,
      subject: `Your Weekly Learning Summary — CSE Student Platform`,
      html: `<div style="${baseStyle}">
        <h2>Great work this week, ${userName}! 🎉</h2>
        <p>Here's your learning summary for the past 7 days:</p>
        <div style="display:flex;gap:16px;margin:20px 0;">
          <div style="background:#f0f9ff;padding:20px;border-radius:8px;text-align:center;flex:1;">
            <h3 style="color:#4f46e5;font-size:32px;margin:0;">${lessonsCompleted}</h3>
            <p style="margin:4px 0;color:#666;">Lessons Completed</p>
          </div>
          <div style="background:#f0fdf4;padding:20px;border-radius:8px;text-align:center;flex:1;">
            <h3 style="color:#16a34a;font-size:32px;margin:0;">${minutesStudied}</h3>
            <p style="margin:4px 0;color:#666;">Minutes Studied</p>
          </div>
        </div>
        <p>Keep up the momentum! Your consistency is building a solid foundation.</p>
        <a href="${env.CLIENT_URL}/learning" style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">Continue Learning</a>
      </div>`,
    });
    logger.info(`Weekly summary email sent`, { to: email });
  } catch (error) {
    logger.error('Failed to send weekly summary email', { error, email });
    throw error;
  }
};
