import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateTitle } from "../utils/generateTitleWapper.js";
import { extractAudio } from "../utils/videoToText.js";

const GenerateTitle =asyncHandler( async(req, res)=>{
    const video = req.file
    const videopath = req.file.path
    if (!video){
        return new ApiError(400, "sorry no video avaible you need to provide video inorder to generate the title ")    
    }
    const description =  await extractAudio(videopath)
    if(!description){
        return new ApiError(400,"could not convert video into text")
    }
    console.log("checking description:",description)
    const title = await generateTitle(description)
    console.log("checking title:",title)

    if(!title){
        return new (500 , "something went wrong cannot generate title try again")
    }
    return res.status(200)
              .json(new ApiResponse(200,title,"title generated successfully"))
})

export{
    GenerateTitle
}