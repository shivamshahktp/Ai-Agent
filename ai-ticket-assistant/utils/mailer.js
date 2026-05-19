import nodemailer from "nodemailer"
export const sendMail = async (to, subject, text) => { 
    try {
        // Create a transporter using SMTP
        const transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_SMTP_HOST,
            port: process.env.MAILTRAP_SMTP_PORT,
            secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
            auth: { //we write auth so that anyone cant reach the username and password in mailtrap...auth means authentication
                user: process.env.MAILTRAP_SMTP_USER,
                pass: process.env.MAILTRAP_SMTP_PASS,
            },
        });
        /**
              * Asynchronously(async) dispatches an email using the configured transporter.
              * Uses 'await' to ensure the SMTP transaction completes before proceeding,
              * preventing race conditions or unhandled promises.
              */
        const info = await transporter.sendMail({ //await keeps the compiler here only before going to the next line before the work is 100% executed
            from: '"Inngest TMS', 
            to,
            subject,
            text,
        });

        console.log("Message sent: %s", info.messageId);
        return info
    } catch (error) {
            console.error("❌ Mail error",error.message)
            throw error;
    }
    
}
