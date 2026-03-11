import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firebaseConfig";
import MessagesComponent from 'components/Messages/MessagesComponent';

const CatalystMessages = () => {
  const config = {
    
  }
  return (
    <MessagesComponent config={{}} />
  );
};

export default CatalystMessages;