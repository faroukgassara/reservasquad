enum Elang {
    fr = "fr",
    en = "en",
}

enum EButtonSize {
    small = "small",
    medium = "medium",
    large = "large"
}

enum EActionType {
    get = 'get',
    create = 'create',
    update = 'update',
    delete = 'delete',
}

enum EInputStatus {
    default = 'default',
    success = 'success',
    error = 'error',
}

enum EInputType {
    text = 'text',
    password = 'password',
    number = 'number',
    intNumber = 'intNumber',
    email = 'email',
    radio = 'radio',
    date = 'date',
}

enum EInputSize {
    small = "small",
    medium = "medium",
    large = "large"
}

enum EToggleSize {
    sm = "sm",
    md = "md",
    lg = "lg"
}

enum ESort {
    asc = 'asc',
    desc = 'desc'
}

enum EVariantLabel {
    h1 = 'h1',
    h2 = 'h2',
    h3 = 'h3',
    h4 = 'h4',
    h5 = 'h5',
    h6 = 'h6',
    body = 'body',
    caption = 'caption',
    subtitle = 'subtitle',
    hint = 'hint',
    overline = 'overline',
    bodyLarge = 'body-lg',
    bodySmall = 'body-sm',
}

enum IconComponentsEnum {
    settings = 'settings',
    loader = 'loader',
    eye = 'eye',
    eyeClose = 'eyeClose',
    info = 'info',
    checkbox = 'checkbox',
    squaresFour = 'squaresFour',
    bookOpenText = 'bookOpenText',
    drop = 'drop',
    close = 'close',
    menu = 'menu',
    moreHorizontal = 'moreHorizontal',
    user = 'user',
    bookOpenTextRotated = 'bookOpenTextRotated',
    check = 'check',
    pdf = 'pdf',
    video = 'video',
    uplaod = 'uplaod',
    layer = 'layer',
    image = 'image',
    filetext = 'filetext',
    arrowLeft = 'arrowLeft',
    collapse = 'collapse',
    archive = 'archive',
    bell = 'bell',
    layers = 'layers',
    calendar = 'calendar',
    home = 'home',
    users = 'users',
    chevronLeft = 'chevronLeft',
    chevronRight = 'chevronRight',
    chevronDown = 'chevronDown',
    chevronUp = 'chevronUp',
    dot = 'dot',
    arrowRight = 'arrowRight',
    search = 'search',
    shoppingCart = 'shoppingCart',
    star = 'star',
    scissors = 'scissors',
    penNib = 'penNib',
    printer = 'printer',
    gift = 'gift',
    truck = 'truck',
    sparkles = 'sparkles',
    car = 'car',
    plus = 'plus',
    arrowUp = 'arrowUp',
    arrowDown = 'arrowDown',
    dropDown = 'dropDown',
    columns = 'columns',
    edit = 'edit',
    filter = 'filter',
    logOut = 'logOut',
    trash = 'trash',
    userCheck = 'userCheck',
    clock = 'clock',
    message = 'message',
    rotate = 'rotate',
    checkCircle = 'checkCircle',
    alert = "alert",
    hand = "hand",
    emptyState = "emptyState",
    youtube = "youtube",
    instagram = "instagram",
    facebook = "facebook",
    xTwitter = "xTwitter",
}

enum EButtonType {
    primary = 'primary',
    secondary = 'secondary',
    tertiary = 'tertiary',
}

enum ETypographyType {
    // Headings
    H1Desktop = 'h1Desktop',
    H1App = 'h1App',
    H2 = 'h2',
    H3 = 'h3',

    // Subtitles
    Subtitle = 'subtitle',

    // Body text (Sans)
    BodyLargeMedium = 'bodyLargeMedium',
    BodyMediumBold = 'bodyMediumBold',
    BodyMedium = 'bodyMedium',
    BodyRegular = 'bodyRegular',
    BodySmallMedium = 'bodySmallMedium',
    BodySmallRegular = 'bodySmallRegular',

    // Buttons and inputs
    Button = 'button',
    Input = 'input',

    // Mono font styles
    MonoSubtitle = 'monoSubtitle',
    MonoCaptionMedium = 'monoCaptionMedium',
    MonoBodyMedium = 'monoBodyMedium',
    MonoBodySmall = 'monoBodySmall',
    MonoCaptionSmall = 'monoCaptionSmall',
}

enum ESizeCheckBox {
    sm = 'min-w-3 min-h-3 max-w-3 max-h-3',
    md = 'min-w-4 min-h-4 max-w-4 max-h-4',
    lg = 'min-w-5 min-h-5 max-w-5 max-h-5'
}

enum ECheckBoxStatus {
    checked = 'checked',
    unchecked = 'unchecked'
}

enum ESizeRadio {
    sm = 'min-w-3 min-h-3 max-w-3 max-h-3',
    md = 'min-w-4 min-h-4 max-w-4 max-h-4',
    lg = 'min-w-5 min-h-5 max-w-5 max-h-5',
}

enum ESize {
    xs = 'xs',
    sm = 'sm',
    md = 'md',
    lg = 'lg',
    xl = 'xl'
}

enum ERadioStatus {
    checked = 'checked',
    unchecked = 'unchecked',
}

enum EToastType {
    ERROR = "ERROR",
    SUCCESS = "SUCCESS",
    INFO = "INFO",
    WARNING = "WARNING",
}

enum EBadgeSize {
    tiny = "tiny",
    small = "small",
    medium = "medium"
}

enum EBadgeType {
    primary = 'primary',
    success = 'success',
    warning = 'warning',
    error = 'error',
    revprimary = 'revprimary',
    revsuccess = 'revsuccess',
    revwarning = 'revwarning',
    reverror = 'reverror',
}

export {
    Elang,
    EButtonSize,
    EActionType,
    EInputStatus,
    EInputType,
    EInputSize,
    ESort,
    EToggleSize,
    ETypographyType,
    IconComponentsEnum,
    EButtonType,
    ECheckBoxStatus,
    ESizeCheckBox,
    ERadioStatus,
    ESizeRadio,
    EBadgeSize,
    EBadgeType,
    ESize,
    EToastType,
    EVariantLabel
}
