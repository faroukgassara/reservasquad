import { ILangKey } from "./lang.interface"

const lang: ILangKey = {
    resetPassword: {
        subject: "Réinitialiser le mot de passe",
        description: ["Bonjour ! ", "Vous avez oublié votre mot de passe.", "Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe et continuer à utiliser votre compte personnel."],
        btnText: "Réinitialiser le mot de passe",
        icon: "refresh",
        title: "Mail de récupération du mot de passe."
    },
    confirmationEmail: {
        subject: "Confirmer votre Email",
        description: ["Bonjour ! ", " Nous vous remercions d'avoir rejoint Weven's", "Votre code de verification est :"],
        title: "confirmation de votre Email"
    },
    sendReclamtion: {
        subject: "Reclamation",
        description: [],
        title: "Réclamation",
        complaintType: {
            technical: "Problème technique",
            inappropriateContent: "Contenu inapproprié",
            assistance: "Assistance requise "
        },
        send: "vous a envoyé une réclamation.",
        type: "Type: ",
        userMessage: "Description: "
    },
    payementReminder: {
        subject: "Rappel de Paiement",
        title: "Rappel de Paiement",
        description: [],
        subscribtionExpiresAt: "Nous tenons à vous notifier que votre abonnement arrive à échéance le ",
        resubscribeMessage: "Nous vous prions de renouveller votre abonnement le plus tôt est possible",
        amount: "Montant  à  payer :",
        btnText: "Aller à la page Paiement",
    },
    contact: {
        subject: "Contact",
        title: "Nouveau message:",
        name: "Nom: ",
        email: "Email: ",
        phoneNumber: "Téléphone: ",
        description: [],
        message: "Message: "
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
export default lang