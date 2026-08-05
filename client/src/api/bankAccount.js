import api from './index.js';
import { v4 as uuidv4 } from 'uuid';

export async function getBankAccount() {
  const { data } = await api.get('/bank-account');
  return data;
}

export async function createBankAccount(accountData) {
  const { data } = await api.post('/bank-account', accountData, {
    headers: {
      'Idempotency-Key': uuidv4()
    }
  });
  return data;
}

export async function updateBankAccount(id, accountData) {
  const { data } = await api.patch(`/bank-account/${id}`, accountData, {
    headers: {
      'Idempotency-Key': uuidv4()
    }
  });
  return data;
}

export async function deleteBankAccount(id) {
  const { data } = await api.delete(`/bank-account/${id}`);
  return data;
}

export async function adminVerifyBankAccount(id, payload) {
  const { data } = await api.patch(`/bank-account/admin/${id}/verify`, payload);
  return data;
}
