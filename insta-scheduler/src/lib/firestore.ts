import { getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export const db = getFirestore(getApp());


