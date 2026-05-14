import { Injectable, BadRequestException } from '@nestjs/common';
import * as mkdirp from 'mkdirp';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { imageToBase64 } from 'image-to-base64';
import * as ejs from 'ejs';
import * as path from 'path';
import axios from 'axios';
@Injectable()
export class FileUploadService {
  async upload(type: string, file: any): Promise<string> {
    const directoryPath = path.join(__dirname, '../../../public/', type, '/');
    const url = type + '/';

    mkdirp.sync(directoryPath);
    const fileSplit = file.originalname.split('.');
    const extension = fileSplit[fileSplit.length - 1];
    const name = uuidv4();
    const filePath = directoryPath + name + '.' + extension;
    fs.writeFile(filePath, file.buffer, (err) => {
      if (err) {
        throw new BadRequestException({ message: 'file has not been writen!' });
      }
    });
    return url + name + '.' + extension;
  }
  async validateImageFile(file: any) {
    const extension = file.mimetype.split('/')[1];
    if (extension.toLowerCase() == 'jpeg' || extension.toLowerCase() == 'png') {
      return true;
    } else return false;
  }
  async convertBase64(type: string, base64: string): Promise<string> {
    const directoryPath = path.join(__dirname, '../../../public/', type, '/');
    const url = type + '/';
    mkdirp.sync(directoryPath);
    const name = uuidv4();
    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new BadRequestException('Invalid base64 image format');
    }
    const responseType = matches[1];
    const responseData = Buffer.from(matches[2], 'base64');
    const extension = responseType.split('/')[1]?.toLowerCase() || 'jpg';
    const allowedExtensions = ['png', 'jpeg', 'jpg', 'webp', 'gif'];
    if (!allowedExtensions.includes(extension)) {
      throw new BadRequestException('Image must be PNG, JPEG, WebP or GIF');
    }
    const ext = extension === 'jpeg' ? 'jpg' : extension;
    const filePath = path.join(directoryPath, name + '.' + ext);
    await fs.promises.writeFile(filePath, responseData);
    return url + name + '.' + ext;
  }
  async deleteFileFromFolder(pathFile: string) {
    try {
      fs.unlinkSync(pathFile);
    } catch (err) {
      throw err;
    }
  }
  deletefile(path: string, reject: any): void {
    if (fs.existsSync(path)) {
      fs.unlink(path, (err) => {
        if (err) {
          reject(err);
        }
      });
    }
  }
  async generateFileName(file: any): Promise<string> {
    const fileSplit = file.originalname.split('.');
    const extension = fileSplit[fileSplit.length - 1];
    const name = uuidv4();
    return name + '.' + extension;
  }
  async validatePdfFile(file: any) {
    const extension = file.mimetype.split('/')[1];
    if (extension.toLowerCase() == 'pdf') {
      return true;
    } else return false;
  }
  async getBase64(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      imageToBase64(path)
        .then((response: any) => {
          resolve(response);
        })
        .catch((error: Error) => {
          reject(error);
        });
    });
  }
  async loadFileIntoBuffer(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      return response.data;
    } catch (error) {
      console.error('Error loading file:', error);
      throw error;
    }
  }
  async renderTemplate(content, templateName): Promise<any> {
    const template = await ejs.renderFile(
      path.resolve(__dirname, '../../../view', templateName),
      content,
    );
    return template;
  }
}
