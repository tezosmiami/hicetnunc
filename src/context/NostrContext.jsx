import { useEffect, useState, createContext, useContext, useRef} from "react";

const NostrContext = createContext();

const NostrContextProvider = ({ children }) => {
    const wrapped = {}
    return (
        <NostrContext.Provider value={wrapped}>
               {children}
        </NostrContext.Provider>
      
      );
  };
  
  export default NostrContextProvider;