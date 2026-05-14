interface ICreateModule {
    fr: string,
}
interface IModuleAccess {
    [key: string]: { [k: string]: boolean }
}
enum ESubAccess {
    edit = 'edit',
    get = 'get',
    delete = 'delete',
    inaccessible = "inaccessible",
}
export type { ICreateModule, IModuleAccess }
export { ESubAccess }