import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "youmonkeyy1008@gmail.com",
    pass: "cnjdrdplskphwuaq",
  },
});

async function testEmail() {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "youmonkeyy1008@gmail.com", // can be yourself
      subject: "Test email",
      text: "Hello, this is a test!",
    });
    console.log("Email sent successfully!");
  } catch (err) {
    console.error("what is error",err);
  }
}

testEmail();
