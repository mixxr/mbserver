import {Db, Collection} from 'mongodb';
import {RefreshReport} from '../model/refresh-report';

export interface INormalizer{
    start(jsonFilename: string, coll: Collection, callback: any):void;
}