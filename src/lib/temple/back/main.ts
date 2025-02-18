import { Runtime } from 'webextension-polyfill-ts';

import * as Actions from 'lib/temple/back/actions';
import { intercom } from 'lib/temple/back/defaults';
import { store, toFront } from 'lib/temple/back/store';
import { TempleMessageType, TempleRequest, TempleResponse } from 'lib/temple/types';

const frontStore = store.map(toFront);

export async function start() {
  intercom.onRequest(processRequest);
  await Actions.init();
  frontStore.watch(() => {
    intercom.broadcast({ type: TempleMessageType.StateUpdated });
  });
}

async function processRequest(req: TempleRequest, port: Runtime.Port): Promise<TempleResponse | void> {
  switch (req?.type) {
    case TempleMessageType.GetStateRequest:
      const state = await Actions.getFrontState();
      return {
        type: TempleMessageType.GetStateResponse,
        state
      };
    case TempleMessageType.GetSignumTxKeysRequest:
      const { signingKey, publicKey: pk } = await Actions.getSignumTxKeys(req.accountPublicKeyHash);
      return {
        type: TempleMessageType.GetSignumTxKeysResponse,
        signingKey,
        publicKey: pk
      };
    case TempleMessageType.NewWalletRequest:
      await Actions.registerNewWallet(req.password, req.mnemonic);
      return { type: TempleMessageType.NewWalletResponse };

    case TempleMessageType.UnlockRequest:
      await Actions.unlock(req.password);
      return { type: TempleMessageType.UnlockResponse };

    case TempleMessageType.LockRequest:
      await Actions.lock();
      return { type: TempleMessageType.LockResponse };

    case TempleMessageType.CreateAccountRequest: {
      const mnemonic = await Actions.createAccount(req.name);
      return {
        type: TempleMessageType.CreateAccountResponse,
        mnemonic
      };
    }

    case TempleMessageType.RevealPublicKeyRequest:
      const publicKey = await Actions.revealPublicKey(req.accountPublicKeyHash);
      return {
        type: TempleMessageType.RevealPublicKeyResponse,
        publicKey
      };

    case TempleMessageType.RevealPrivateKeyRequest:
      const privateKey = await Actions.revealPrivateKey(req.accountPublicKeyHash, req.password);
      return {
        type: TempleMessageType.RevealPrivateKeyResponse,
        privateKey
      };

    case TempleMessageType.RevealMnemonicRequest:
      const mnemonic = await Actions.revealMnemonic(req.password);
      return {
        type: TempleMessageType.RevealMnemonicResponse,
        mnemonic
      };

    case TempleMessageType.RemoveAccountRequest:
      await Actions.removeAccount(req.accountPublicKeyHash, req.password);
      return {
        type: TempleMessageType.RemoveAccountResponse
      };

    case TempleMessageType.EditAccountRequest:
      await Actions.editAccount(req.accountPublicKeyHash, req.name);
      return {
        type: TempleMessageType.EditAccountResponse
      };

    case TempleMessageType.ImportAccountRequest:
      await Actions.importAccount(req.privateKey, req.encPassword);
      return {
        type: TempleMessageType.ImportAccountResponse
      };

    case TempleMessageType.ImportMnemonicAccountRequest:
      await Actions.importMnemonicAccount(req.mnemonic, req.name);
      return {
        type: TempleMessageType.ImportMnemonicAccountResponse
      };

    case TempleMessageType.ImportFundraiserAccountRequest:
      await Actions.importFundraiserAccount(req.email, req.password, req.mnemonic);
      return {
        type: TempleMessageType.ImportFundraiserAccountResponse
      };

    case TempleMessageType.ImportManagedKTAccountRequest:
      await Actions.importManagedKTAccount(req.address, req.chainId, req.owner);
      return {
        type: TempleMessageType.ImportManagedKTAccountResponse
      };

    case TempleMessageType.ImportWatchOnlyAccountRequest:
      await Actions.importWatchOnlyAccount(req.address, req.chainId);
      return {
        type: TempleMessageType.ImportWatchOnlyAccountResponse
      };

    case TempleMessageType.CreateLedgerAccountRequest:
      await Actions.craeteLedgerAccount(req.name, req.derivationPath, req.derivationType);
      return {
        type: TempleMessageType.CreateLedgerAccountResponse
      };

    case TempleMessageType.UpdateSettingsRequest:
      await Actions.updateSettings(req.settings);
      return {
        type: TempleMessageType.UpdateSettingsResponse
      };

    case TempleMessageType.OperationsRequest:
      const { opHash } = await Actions.sendOperations(port, req.id, req.sourcePkh, req.networkRpc, req.opParams);
      return {
        type: TempleMessageType.OperationsResponse,
        opHash
      };

    case TempleMessageType.SignRequest:
      const result = await Actions.sign(port, req.id, req.sourcePkh, req.bytes, req.watermark);
      return {
        type: TempleMessageType.SignResponse,
        result
      };

    case TempleMessageType.DAppGetAllSessionsRequest:
      const allSessions = await Actions.getAllDAppSessions();
      return {
        type: TempleMessageType.DAppGetAllSessionsResponse,
        sessions: allSessions
      };

    case TempleMessageType.DAppRemoveSessionRequest:
      const sessions = await Actions.removeDAppSession(req.origin);
      return {
        type: TempleMessageType.DAppRemoveSessionResponse,
        sessions
      };

    case TempleMessageType.PageRequest:
      const dAppEnabled = await Actions.isDAppEnabled();
      if (dAppEnabled) {
        if (req.payload === 'PING') {
          return {
            type: TempleMessageType.PageResponse,
            payload: 'PONG'
          };
        }
        const resPayload = await Actions.processDApp(req.origin, req.payload);
        return {
          type: TempleMessageType.PageResponse,
          payload: resPayload ?? null
        };
      }
      break;
  }
}
