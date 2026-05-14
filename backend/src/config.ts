require('dotenv').config();

const ACCESS_TOKEN_TIMEOUT = process.env.ACCESS_TOKEN_TIMEOUT
const REFRESH_TOKEN_TIMEOUT = process.env.REFRESH_TOKEN_TIMEOUT
const RESSET_PASSWORD_TOKEN = process.env.RESSET_PASSWORD_TOKEN
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'JWT'
const DEFAULT_QUERY_LIMIT = 10
const APP_CONFIG_PROVIDER = "AppConfigProvider"
const DB_PROVIDER = "DatabaseToken"
const USER_PROVIDER = "UserProvider"
const SEEDER_PROVIDER = 'SeederProvider';
const SOCKET_PROVIDER = 'SocketProvider';
const USER_ACCESS_GROUP_GUARDS_KEY = 'user-access_groups';
const CSV_MIME_TYPES = ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/x-csv', 'application/x-csv', 'text/plain']

export {
    JWT_SECRET_KEY,
    USER_PROVIDER,
    DB_PROVIDER,
    RESSET_PASSWORD_TOKEN,
    ACCESS_TOKEN_TIMEOUT,
    REFRESH_TOKEN_TIMEOUT,
    DEFAULT_QUERY_LIMIT,
    APP_CONFIG_PROVIDER,
    SEEDER_PROVIDER,
    SOCKET_PROVIDER,
    USER_ACCESS_GROUP_GUARDS_KEY,
    CSV_MIME_TYPES
}

