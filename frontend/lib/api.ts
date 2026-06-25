export type AudioUploadResult = {
  uploadId: string;
};

export type ArtworkResult = {
  artworkId: string;
  imageUrl: string;
};

export type LoginResult = {
  userId: string;
};

export async function uploadAudio(_file: File): Promise<AudioUploadResult> {
  return { uploadId: "mock-upload-id" };
}

export async function generateArtwork(_uploadId: string): Promise<ArtworkResult> {
  return { artworkId: "mock-artwork-id", imageUrl: "/image/generated-sample.png" };
}

export async function login(_email: string, _password: string): Promise<LoginResult> {
  return { userId: "mock-user-id" };
}

export async function saveArtwork(_artworkId: string): Promise<{ saved: true }> {
  return { saved: true };
}
