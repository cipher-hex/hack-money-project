// IMP START - Quick Start
import { WEB3AUTH_NETWORK } from "@web3auth/modal";
import { type Web3AuthContextConfig } from "@web3auth/modal/react";
// IMP END - Quick Start

// IMP START - Dashboard Registration
// Hedera Project Client ID
const clientId =
  "BDGsCBEEofH_p6pVTyPxkpAQI4_929rCkD4nRtUoGxyCkwlTCrDVXRtByao8at-OtiSyj9Bj0Trm1uy3t5bY03Y";

// EVM Project Client ID
// const clientId =
//   "BF90UJslt478-ruy3FNP6G5yEU6KAS2QgITdns_ZL5qO3xFrjfYWdKmSTbwEqxm-Zk_4XMXH5x95-OUBTJ3yAP0";
// old client id
// const clientId =
//   "BHgArYmWwSeq21czpcarYh0EVq2WWOzflX-NTK-tY1-1pauPzHKRRLgpABkmYiIV_og9jAvoIxQ8L3Smrwe04Lw";

// get from https://dashboard.web3auth.io
// IMP END - Dashboard Registration

// IMP START - Config
const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  },
};
// IMP END - Config

export default web3AuthContextConfig;
