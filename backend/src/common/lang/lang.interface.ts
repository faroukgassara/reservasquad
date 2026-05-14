interface ILangKey {
    resetPassword: {
        subject: string,
        description: string[],
        btnText: string,
        icon: string,
        title: string
    },
    confirmationEmail: {
        subject: string,
        title: string,
        description: string[],
    },
    sendReclamtion: {
        subject: string,
        title: string,
        description: string[],
        complaintType: {
            technical: string,
            inappropriateContent: string,
            assistance: string
        },
        type: string,
        userMessage: string
        send: string
    },
    payementReminder: {
        subject: string,
        title: string,
        description: string[],
        subscribtionExpiresAt: string,
        resubscribeMessage: string,
        amount: string,
        btnText: string,
    },
    contact: {
        subject: string,
        title: string,
        name: string,
        message: string,
        description: string[],
        email: string,
        phoneNumber: string,
        // complaintType: {
        //     technical: string,
        //     inappropriateContent: string,
        //     assistance: string
        // },
        // type: string,
        // userMessage: string
        // send: string
    },

}
export { ILangKey }