export interface IEnv {
  DATABASE_URL: string

  JWT_SECRET: string
  JWT_SECRET_EXPIRES_IN: string
  JWT_REFRESH_SECRET: string
  JWT_REFRESH_SECRET_EXPIRES_IN: string
  JWT_RESET_SECRET: string
  JWT_RESET_SECRET_EXPIRES_IN: string

  ENVIRONMENT: string
  PORT: string
  HOST: string
  FRONT_URL: string

  SMTP_HOST_ADDRESS: string
  SMTP_PORT: string
  SMTP_USER: string
  SMTP_PASSWORD: string
  SMTP_SEND: string
  MAIL_SECURE: string

  ADMIN_EMAIL: string
  ADMIN_PASSWORD: string
  ADMIN_FIRSTNAME: string
  ADMIN_LASTNAME: string
  ADMIN_PHONE: string

  UPLOAD_DIR: string
}
export const env = () => ({
  env: {
    DATABASE_URL: process.env.DATABASE_URL,

    JWT_SECRET: process.env.JWT_SECRET,
    JWT_SECRET_EXPIRES_IN: process.env.JWT_SECRET_EXPIRES_IN,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_REFRESH_SECRET_EXPIRES_IN: process.env.JWT_REFRESH_SECRET_EXPIRES_IN,
    JWT_RESET_SECRET: process.env.JWT_RESET_SECRET,
    JWT_RESET_SECRET_EXPIRES_IN: process.env.JWT_RESET_SECRET_EXPIRES_IN,

    ENVIRONMENT: process.env.ENVIRONMENT,
    PORT: process.env.PORT,
    HOST: process.env.HOST,
    FRONT_URL: process.env.FRONT_URL,

    SMTP_HOST_ADDRESS: process.env.SMTP_HOST_ADDRESS,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_SEND: process.env.SMTP_SEND,
    MAIL_SECURE: process.env.MAIL_SECURE,

    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_FIRSTNAME: process.env.ADMIN_FIRSTNAME,
    ADMIN_LASTNAME: process.env.ADMIN_LASTNAME,
    ADMIN_PHONE: process.env.ADMIN_PHONE,

    UPLOAD_DIR: process.env.UPLOAD_DIR,
  }
});
