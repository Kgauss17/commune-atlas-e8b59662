export interface Voter {
  orderNumber: number;
  cin: string;
  address: string;
  birthDate: string;
  firstName: string;
  lastName: string;
  gender: string;
  circonscription: string;
  commune: string;
  bvName: string;
  bvAddress: string;
  bvLocation: string;
  province: string;
}

export interface MatrixRow {
  commune: string;
  circonscription: string;
  bv: string;
  count: number;
}
