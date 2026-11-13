import { cookies } from "next/headers";
import {
  DEMO_SESSION_COOKIE,
  DEMO_ACCOUNTS,
  DemoAccount,
  getDemoAccountByKey,
} from "./auth-shared";

export {
  DEMO_SESSION_COOKIE,
  DEMO_ACCOUNTS,
  type DemoAccount,
  getDemoAccountByKey,
};

export function getCurrentSession(): DemoAccount {
  try {
    const cookieStore = cookies();
    const key = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
    return getDemoAccountByKey(key);
  } catch {
    return DEMO_ACCOUNTS[0];
  }
}
