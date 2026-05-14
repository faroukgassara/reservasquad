enum ERoleEnum {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

enum EJwtStrategy {
  accessToken = "accessToken",
  refreshToken = "refreshToken",
  resetPassword = "resetPassword"
}

enum EFileType {
  document = "document",
  image = "image"
}

enum EType {
  product = 'product',
  promo = 'promo'
}

enum EModule {
  INVITATION = 'INVITATION',
  SEEDER = 'SEEDER',
  USER = 'USER',
  ROLE = 'ROLE',
  PERMISSION = 'PERMISSION',
  FILE = 'FILE',
}

export {
  ERoleEnum,
  EJwtStrategy,
  EFileType,
  EType,
  EModule,
}