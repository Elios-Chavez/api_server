export class ApiRequestError extends Error{constructor(message:string,public status?:number){super(message);this.name='ApiRequestError'}}
