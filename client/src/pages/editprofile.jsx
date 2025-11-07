import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/components/ui/card";
import { Input } from "../components/components/ui/input";
import { Button } from "../components/components/ui/button";

function EditProfile() {
 const [data , setData]= useState()
 const [profilePicture , setProfilePicture]= useState()
 const [username, setUsername] = useState()
 const handleSubmit=async()=>{
  
 }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Edit Profile</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Profile Picture */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <img
                  src={preview || "/default-avatar.png"}
                  alt="Profile Preview"
                  className="w-28 h-28 rounded-full object-cover border-2 border-gray-300"
                />
              </div>
              <label className="cursor-pointer text-blue-600 hover:underline">
                Change Picture
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Username */}
            <div>
              <label className="text-sm font-semibold mb-1 block">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>

            <Button type="submit" className="w-full mt-4">
              Save Changes
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-center text-gray-500 text-sm">
          You can update your username and profile picture here.
        </CardFooter>
      </Card>
    </div>
  );
}

export default EditProfile;
