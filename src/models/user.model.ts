import { ObjectId } from 'bson';

export interface ICreateUser {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: string
}

export interface IUserLogin {
  email: string;
  password: string;
}

export interface IUser {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
  password?: string;
  role: string
}

export interface IJwtUserData {
  id: string;
  email: string;
  fullName: string;
}

export interface IPasswordChange {
  oldPassword: string;
  newPassword: string;
}
