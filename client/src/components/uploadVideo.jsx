import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { hideForm } from "../redux/formSlice";
import { useDispatch, useSelector } from "react-redux";
import { publishAVideo } from "../api/videosapi/videoapi";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { GenerateTitle } from "../api/Ai-Api/Ai-Api.jsx";

function UploadVideo() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [video, setVideo] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const showForm = useSelector((state) => state.form.showForm);

  if (!showForm) return null;

  // Cancel and reset everything
  const handleCancel = () => {
    setDescription("");
    setThumbnail(null);
    setTitle("");
    setVideo(null);
    setErrorMessage("");
    dispatch(hideForm());
  };

  // Handle AI title generation
  const handleTitle = async () => {
    if (!video) {
      setErrorMessage("⚠️ Please upload a video first");
      return;
    }

    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("video", video);

      const response = await GenerateTitle(formData);

      // Assuming backend returns { success: true, data: "generated title" }
      if (response?.data?.success && response.data.data) {
        setTitle(response.data.data); // set title input box
      } else {
        setErrorMessage("Failed to generate title. Please try again.");
      }
    } catch (error) {
      console.error("❌ Failed to generate title:", error);
      setErrorMessage("Failed to generate title. Please try again.");
    }
  };

  // Handle video upload
  const handleData = async (e) => {
    e.preventDefault();

    if (!title || !description || !thumbnail || !video) {
      setErrorMessage("⚠️ Please fill all required fields before proceeding.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("thumbnail", thumbnail);
      formData.append("video", video);

      await publishAVideo(formData);
      alert("✅ Video uploaded successfully!");
      navigate("/");
    } catch (error) {
      console.error("❌ Something went wrong while uploading video:", error);
      setErrorMessage("Failed to upload video. Please try again.");
    }
  };

  return (
    <div className="flex justify-center min-h-screen px-6 py-12 bg-gray-100 dark:bg-gray-900 transition-colors duration-500">
      <Card className="w-full max-w-4xl rounded-2xl shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Upload Your Video
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form className="space-y-6">
            {/* Upload Section */}
            <div className="flex flex-col md:flex-row justify-center gap-6">
              {/* Video Upload */}
              <label className="flex flex-col items-center justify-center w-[40vh] h-[30vh] bg-gray-200 dark:bg-gray-700 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors relative overflow-hidden">
                {video ? (
                  <video
                    src={URL.createObjectURL(video)}
                    controls
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <span className="text-gray-600 dark:text-gray-300">
                    Upload Video
                  </span>
                )}
                <input
                  onChange={(e) => setVideo(e.target.files[0])}
                  type="file"
                  accept="video/*"
                  className="hidden"
                />
              </label>

              {/* Thumbnail Upload */}
              <label className="flex flex-col items-center justify-center w-[40vh] h-[30vh] bg-gray-200 dark:bg-gray-700 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors relative overflow-hidden">
                {thumbnail ? (
                  <img
                    src={URL.createObjectURL(thumbnail)}
                    alt="Thumbnail Preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <span className="text-gray-600 dark:text-gray-300">
                    Upload Thumbnail
                  </span>
                )}
                <input
                  onChange={(e) => setThumbnail(e.target.files[0])}
                  type="file"
                  accept="image/*"
                  className="hidden"
                />
              </label>
            </div>

            {/* Title Field */}
            <div>
              <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Title
              </label>
              <div className="flex gap-2 items-center">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  id="title"
                  type="text"
                  placeholder="Enter video title"
                  className="w-full"
                />
                <Button
                  type="button"
                  onClick={handleTitle}
                  className="bg-blue-600 hover:bg-blue-800 text-white flex items-center gap-2 px-6 py-2 rounded-lg"
                >
                  <Sparkles size={16} /> Generate
                </Button>
              </div>
              {errorMessage && (
                <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
              )}
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                id="description"
                placeholder="Enter video description"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4">
              <Button type="button" onClick={handleCancel} className="bg-red-500 hover:bg-red-700 text-white px-6 py-2 rounded-lg">
                Cancel
              </Button>
              <Button type="submit" onClick={handleData} className="bg-blue-600 hover:bg-blue-800 text-white px-6 py-2 rounded-lg">
                Upload
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default UploadVideo;
