import { Component, OnInit } from '@angular/core';
// import { parseString } from 'xml2js';
import * as xml2js from 'xml2js';
import { GoogleTranslateService } from './google-translate.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'app';
  fileContent: any;
  transList: TransItem[] = [];
  scrollHeight = '600px';
  filename = '';
  // 比較用的檔案
  transListCompare: TransItem[] = [];
  compareFileUpload = false;

  constructor(
    private translateService: GoogleTranslateService
  ) { }

  ngOnInit() {
    const headerElement = document.querySelector('#header');
    if (headerElement) {
      const headerHeight = headerElement.clientHeight;
      const bodyMargin = 8 * 2;
      this.scrollHeight = (window.innerHeight - headerHeight - bodyMargin) + 'px';
    }
  }

  onFileUpload(event): void {
    const file = event.target.files[0];
    this.filename = file.name;
    let fileReader = new FileReader();
    fileReader.onload = (e) => {
      const xmlContent = fileReader.result;
      this.parseToJson(xmlContent as string);
    }
    fileReader.readAsText(file);
  }

  parseToJson(xml: string): void {
    xml2js.parseString(xml, (err, result) => {
      this.fileContent = result;
      this.transList = this.fileContent.xliff.file[0].body[0]['trans-unit'].map(item => {
        if (!item.target) {
          item.target = [];
        }
        return item;
      });
    });
  }

  onExportClick(): void {
    let content = this.parseToXlf();
    let link = window.document.createElement('a');
    link.setAttribute('href', 'data:text;charset=utf-8,' + encodeURI(content));
    link.setAttribute('download', this.filename);
    link.click();
  }

  parseToXlf(): string {
    let header = `<?xml version='1.0' encoding='UTF-8' ?>
<xliff version='1.2' xmlns='urn:oasis:names:tc:xliff:document:1.2'>
  <file source-language='en' datatype='plaintext' original='ng2.template'>
    <body>`;
    let footer = `
    </body>
  </file>
</xliff>`;
    let content = '';
    this.transList.forEach(item => {
      try {
        content += `
        <trans-unit id='${this.parseEscapeCharacter(item.$.id)}' datatype='html'>
          <source>${this.parseEscapeCharacter(item.source[0])}</source>
          <context-group purpose='location'>
            <context context-type='sourcefile'>${this.parseEscapeCharacter(item['context-group'][0].context[0]._)}</context>
            <context context-type='linenumber'>${this.parseEscapeCharacter(item['context-group'][0].context[1]._)}</context>
          </context-group>
          <note priority='1' from='description'>${this.parseEscapeCharacter(item.note[0]._)}</note>
          <note priority='1' from='meaning'>${this.parseEscapeCharacter(item.note[1]._)}</note>
          <target>${this.parseEscapeCharacter(item.target[0])}</target>
        </trans-unit>`;
      } catch (error) {
        console.error(item, error);
      }
    });
    return header + content + footer;
  }

  getFilePath(path: string): string {
    const startIndex = path.indexOf('app/');
    return path.substring(startIndex + 4);
  }

  async onGoogleTranslateClick(): Promise<void> {
    for (const row of this.transList) {
      if (row.source && row.source[0] && typeof (row.source[0]) === 'string') {
        const result = await this.translateService.translate(row.source && row.source[0] ? row.source[0] : '').toPromise();
        row.target = [result];
      }
    }
  }

  parseEscapeCharacter(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '%27');
  }

  onFileCompareUpload(event): void {
    const file = event.target.files[0];
    let fileReader = new FileReader();
    fileReader.onload = (e) => {
      const xmlContent = fileReader.result;
      xml2js.parseString(xmlContent, (err, result) => {
        this.transListCompare = result.xliff.file[0].body[0]['trans-unit'].map(item => {
          if (!item.target) {
            item.target = [];
          }
          return item;
        });
      });
      this.compareTranslateContent();
    }
    fileReader.readAsText(file);
  }

  compareTranslateContent(): void {
    this.transListCompare.forEach(citem => {
      const citemId = citem.$.id;
      const citemTarget = citem.target[0];

      const existItem = this.transList.find(item=>{
        const itemId = item.$.id;
        return citemId === itemId;
      });

      if(existItem && citemTarget){
        existItem.target = citem.target;
      }
    });
  }
}

interface TransItem {
  $: { id: string, datatype: string };    // id 及 資料類型: html
  'context-group': TransLocation;         // 翻譯文字在原始檔案的位置資訊
  note: TransNote[];                      // 0: 摘要, 1: 詳細說明
  source: string[];                       // 長度為1, 要翻譯的文字
  target: string[];                       // 翻譯結果
}

interface TransLocation {
  $: { purpose: string };                 // purpose: location
  context: any[];                         // 0: 檔案名稱, 1: 行數及字元數
}

interface TransNote {
  $: { priority: string, from: string };  // priority: 越小越有參考價值, from: meaning 或 description
  _: string;                              // 說明
}

interface XLF {

}
