import { ICreateState, IStateType } from "@/interfaces";
import { getSession } from "next-auth/react";
import { ApiConfig, ApiHeaders, AuthSession } from "../StandardApi/interfaces/common";

class CommonFunction {
  private static instance: CommonFunction
  
  constructor() {
  }
  public static getInstance(
  ): CommonFunction {
    return CommonFunction.instance;
  }

  public truncateTextAtWord(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text
    const truncated = text.slice(0, maxChars)
    const lastSpaceIndex = truncated.lastIndexOf(' ')
    return truncated.slice(0, lastSpaceIndex) + ' ...'
  };

  static createHeaders = async ({
    withToken = true,
    contentType = "application/json",
    customToken = ''
  }: ApiConfig) => {
    const header: ApiHeaders = {};

    if (contentType) {
      header["Content-Type"] = contentType;
      header["Accept"] = contentType;
    }

    if (withToken) {
      const session: AuthSession | null = await getSession()
      const token = session?.accessToken;
      header['Authorization'] = customToken ? customToken : 'Bearer ' + token;
    }

    return header;
  };

  static handleStateValidation(isReadModeOnly: boolean | undefined) {
    let validationState = {}
    if (isReadModeOnly) {
      validationState = {
        isInvalid: false,
        isValid: false,
      }
    }
    return validationState
  }

  public createState({ value = "", disabled = false, label = "", required = false }: any): ICreateState {
    let state: any = {
      value: value,
      isValid: true,
      hintText: "",
      disabled: disabled,
      required,
    }
    if (label) {
      state = {
        ...state,
        label
      }
    }
    return state
  }

  public toLowerCaseKeys = (obj: Record<string, any>): Record<string, any> => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      acc[key.toLowerCase()] = value;
      return acc;
    }, {} as Record<string, any>);
  };

  public scrollTopAndValidation({
    ref,
  }: any) {
    ref && ref?.current?.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    // if (notification && this.openToast) {
    //   this.openToast(
    //     title,
    //     message,
    //     {
    //       type,
    //       icon,
    //       duration,
    //       children
    //     },
    //     toastId
    //   )
    // }
  };

  public capitalizeFirstLetter(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  public extractValues = (form: IStateType | any) => {
    return Object.keys(form).reduce((acc, key) => {
      acc[key] = form?.[key]?.value || form?.[key]?.refs;
      return acc;
    }, {} as Record<string, any>);
  };

  public isTokenExpiringSoon = (expiresAt: number) => {
    const currentTime = Math.floor(Date.now() / 1000);
    return expiresAt - currentTime < 60;
  };

  public refreshAccessToken = async (token: any) => {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to refresh token');
    }

    return {
      ...token,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || token.refreshToken,
      expiresAt: data.expiresAt,
    };
  }

  public getValidAccessToken = async (session: any) => {
    if (this.isTokenExpiringSoon(session.expires_at)) {
      try {
        const refreshedToken = await this.refreshAccessToken(session.accessToken);
        return refreshedToken.accessToken;
      } catch (error) {
        console.error('Error refreshing token:', error);
        throw new Error('Unable to refresh token');
      }
    }
    return session.accessToken;
  };


  public deepEqual = (obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;

    if (
      typeof obj1 !== 'object' ||
      obj1 === null ||
      typeof obj2 !== 'object' ||
      obj2 === null
    ) {
      return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key) || !this.deepEqual(obj1[key], obj2[key])) {
        return false;
      }
    }

    return true;
  };

}
export { CommonFunction }