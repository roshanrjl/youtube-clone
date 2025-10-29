import React from 'react'
import { useState, useEffect } from 'react'
import { useDispatch,useSelector } from 'react-redux'


function Videos() {
    cosnt [videos , setVideos]= useState()
    const user = useSelector((state)=>state.auth)
    console.log("checking user",user)

  return (
    <div>
       {/* card for videos */}
        {videos && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ">
            {profileDatas[0]?.myvideo?.map((video, index) => (
              <Mycard
                key={index}
                className="w-full h-80  bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-700 rounded-lg transition-colors duration-300"
                content={
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                }
                footer={
                  <div className="flex flex-col text-gray-700 dark:text-gray-300 text-sm ">
                    <span className="font-semibold">{video.title}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      {video.views || 0} views • {timeAgo(video.createdAt)}
                    </span>
                  </div>
                }
              />
            ))}
          </div>
        )}


    </div>
  )
}

export default Videos