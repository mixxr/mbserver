export class RefreshReport {
  constructor(
    public mills : number,
    public categories : string[],
    public shopname: string,
    public crawler: string,
    public inserts:number = 0,
    public updates:number = 0,
    public duplicates:number = 0,
    public deletes:number = 0,
    public errors:number = 0,
    public incomplete:number = 0,
    public total:number = 0,
    public skus:any = {},
    public errList:any = {}
  ){}
};