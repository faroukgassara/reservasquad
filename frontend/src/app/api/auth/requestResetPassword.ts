// import { ResetPasswordAPI } from "../StandardApi/api/ResetPassword";


// export default async function handler(req: any, res: any) {
//     const resetPasswordApi = new ResetPasswordAPI()

//     try {
//         const response = await resetPasswordApi.requestResetPassword(req.body);
//         if (response.status) {
//             return res.status(response.status).json({ data: response.data, status: response.status });
//         }
//     } catch (err) {
//         return res.status(500).json({ error: err, message: 'Internal server error' });
//     }

// }
