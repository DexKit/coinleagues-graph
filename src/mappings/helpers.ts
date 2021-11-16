import { log, BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";
import { BITBOY_TEAM } from "./constants";

export let ZERO_BI = BigInt.fromI32(0);
export let ONE_BI = BigInt.fromI32(1);
export let SECOND_BI = BigInt.fromI32(2);
export let THIRD_BI = BigInt.fromI32(3);
export let ZERO_BD = BigDecimal.fromString("0");
export let ONE_BD = BigDecimal.fromString("1");
export let BI_18 = BigInt.fromI32(18);

export const IS_BITBOY_TEAM = (address: string): boolean => {
  return BITBOY_TEAM.includes(
    address.toLowerCase()
  );
};
