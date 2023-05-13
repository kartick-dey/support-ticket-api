import { Global, Injectable } from '@nestjs/common';
import { ObjectId } from 'bson';

@Global()
@Injectable()
export class SharedService {
  public isValidObjectId(id: string) {
    if (ObjectId.isValid(id)) {
      if (String(new ObjectId(id)) === id) return true;
      return false;
    }
    return false;
  }
}
