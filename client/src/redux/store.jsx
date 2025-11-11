import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice"; 
import formReducer from "./formSlice";
import themeReducer from "./themeSlice";
import notificationReducer from "./notificationSlice"

const store = configureStore({
    reducer:{
        auth:authReducer,
        form: formReducer,
        theme: themeReducer,
        notification:notificationReducer,

    }
})  
export default store;