import sns from '@seedao/sns-js';

import { useEffect, useState } from 'react';
import getConfig from "../utils/envCofnig";

export default function useParseSNS(wallet?: string) {
  const [name, setName] = useState<string>();

  useEffect(() => {
    if (wallet) {
      sns.name(wallet,getConfig().NETWORK.rpcs[0]).then((res) => {
        setName(res);
      });
    }
  }, [wallet]);
  return name;
}

export type NameMapType = { [wallet: string]: string };

export function useParseSNSList(wallets: string[] = []) {
  const [nameMap, setNameMap] = useState<NameMapType>({});

  useEffect(() => {
    if (wallets.length) {
      sns.names(wallets,getConfig().NETWORK.rpcs[0]).then((res) => {
        const _name_map: NameMapType = {};
        res.forEach((r, idx) => {
          _name_map[wallets[idx]] = r;
        });
        setNameMap(_name_map);
      });
    } else {
      setNameMap({});
    }
  }, [wallets]);

  return nameMap;
}
