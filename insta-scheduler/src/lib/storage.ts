import { getApp } from "firebase/app";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

const storage = getStorage(getApp());

export async function uploadMediaAndGetUrl({
  file,
  pathPrefix,
}: {
  file: File;
  pathPrefix: string;
}) {
  const key = `${pathPrefix}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, key);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { key, url };
}


