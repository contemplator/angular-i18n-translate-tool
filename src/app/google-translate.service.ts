import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class GoogleTranslateService {
  private key = 'AIzaSyB9pmfhbNiOTXgMUZzQo3rowtLNxPZZAQw';

  constructor(private httpClient: HttpClient) { }

  translate(q: string, source = 'zh-TW', target = 'en', format = 'text'): Observable<any> {
    const headerParam: any = { 'Content-Type': 'application/json' };
    const headers = new HttpHeaders(headerParam);
    const options = { headers };

    const url = `https://translation.googleapis.com/language/translate/v2?key=${this.key}`;
    return this.httpClient.post(url, {
      "q": q,
      "source": source,
      "target": target,
      "format": format
    }, options).pipe(
      map((res: any) => {
        return res.data.translations[0].translatedText;
      }),
      catchError(error => {
        console.error(error);
        return throwError(error);
      })
    );
  }

}