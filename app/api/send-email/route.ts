import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { z } from 'zod'

// Zod schema to validate and sanitize the incoming request body
const emailSchema = z.object({
    to: z.string().email({ message: "Invalid recipient email address" }),
    subject: z.string().min(1, { message: "Subject cannot be empty" }).max(200),
    text: z.string().optional(),
    html: z.string().optional(),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()

        // Validate the request body against the schema
        const result = emailSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { success: false, error: 'Invalid request data', details: result.error.flatten() },
                { status: 400 }
            )
        }

        const { to, subject, text, html } = result.data

        // Create a transporter using SMTP settings
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        })

        // Send mail with defined transport object
        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'PetroGoals'}" <${process.env.SMTP_FROM_EMAIL}>`,
            to,
            subject,
            text,
            html,
        })

        console.log('Message sent: %s', info.messageId)

        return NextResponse.json({ success: true, messageId: info.messageId })
    } catch (error: unknown) {
        // Log the full error server-side for debugging, but never expose it to the client
        console.error('Error sending email:', error)
        return NextResponse.json(
            { success: false, error: 'An internal error occurred while sending the email.' },
            { status: 500 }
        )
    }
}
