package com.example.group3;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.Toast;


import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;


public class cameraActivity extends AppCompatActivity {

    public static final int CAMERA_PERM_CODE = 101;
    public static final int CAMERA_REQUEST_CODE = 102;
    String currentPhotoPath;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        askCameraPermissions();
    }

    private void sendImage() {
        Intent imageIntent = new Intent(this, CreateStoryActivity.class);
        imageIntent.putExtra("imagePath", currentPhotoPath);
        startActivity(imageIntent);
        finish();
    }

    private void askCameraPermissions() {
        if(ContextCompat.checkSelfPermission(this,Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[] {Manifest.permission.CAMERA}, CAMERA_PERM_CODE);
        } else {
            openCamera();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        if (requestCode == CAMERA_PERM_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                openCamera();
            } else {
                Toast.makeText(this, "Camera Permission is required to use the camera.", Toast.LENGTH_LONG).show();
                finish();
            }
        }
    }

    private File createImageFile() throws IOException {
        // Create an image file name
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
        String imageFileName = "JPEG_" + timeStamp + "_";
        File storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        File image = File.createTempFile(
                imageFileName,  /* prefix */
                ".jpg",         /* suffix */
                storageDir      /* directory */
        );

        // Save a file: path for use with ACTION_VIEW intents
        currentPhotoPath = image.getAbsolutePath();
        return image;
    }

    private void openCamera() {
        Intent camera = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (camera.resolveActivity(getPackageManager()) != null) {
            // Create the File where the photo should go
            File photoFile = null;
            try {
                photoFile = createImageFile();
            } catch (IOException ex) {
                // Error occurred while creating the File
            }
            // Continue only if the File was successfully created
            if (photoFile != null) {
                Uri photoURI = FileProvider.getUriForFile(this,
                        "com.example.android.fileprovider",
                        photoFile);
                camera.putExtra(MediaStore.EXTRA_OUTPUT, photoURI);
                startActivityForResult(camera, CAMERA_REQUEST_CODE);
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == CAMERA_REQUEST_CODE && resultCode == RESULT_OK) {
            // After image taken
            //image = (Bitmap) data.getExtras().get("data");
            String strNewName = "resizedImage.jpg";
            String newPath = getExternalFilesDir(Environment.DIRECTORY_PICTURES) + "/" + strNewName;

            try {
                ResizeImages(currentPhotoPath, newPath);
            } catch (IOException e) {
                e.printStackTrace();
            }

            Log.d("bitmap", "" + newPath);
            Intent imageIntent = new Intent(this, CreateStoryActivity.class);
            imageIntent.putExtra("imagePath", newPath);
            startActivity(imageIntent);
            finish();
        } else {
            Intent mapsIntent = new Intent(this, MapsActivity.class);
            startActivity(mapsIntent);
        }
    }

    public static void ResizeImages(String sPath, String sTo) throws IOException {
        Bitmap image = BitmapFactory.decodeFile(sPath);

        if (image.getWidth() >= image.getHeight()) {
            image = Bitmap.createBitmap(image,
                    image.getWidth() / 2 - image.getHeight() / 2,
                    0,
                    image.getHeight(),
                    image.getHeight());
        } else {
            image = Bitmap.createBitmap(image,
                    0,
                    image.getHeight() / 2 - image.getWidth() / 2,
                    image.getWidth(),
                    image.getWidth());
        }

        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        image.compress(Bitmap.CompressFormat.JPEG, 100, bytes);

        File f = new File(sTo);
        f.createNewFile();
        FileOutputStream fo = new FileOutputStream(f);
        fo.write(bytes.toByteArray());
        fo.close();

        File file = new File(sPath);
        file.delete();
    }
}