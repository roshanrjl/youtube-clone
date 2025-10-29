import apiClient from "../ApiClient/ApiClinet";


export const GenerateTitle=(formdata)=>{
 return apiClient.post("uploads/ai" , formdata)
}