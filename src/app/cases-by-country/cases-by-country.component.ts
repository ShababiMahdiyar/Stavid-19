import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Papa } from 'ngx-papaparse';

@Component({
  selector: 'app-cases-by-country',
  templateUrl: './cases-by-country.component.html',
  styleUrls: ['./cases-by-country.component.scss']
})
export class CasesByCountryComponent {

  rawCsvData: any[] = [];
  proccessedData: any[] = [];

  constructor(private papa: Papa, private http: HttpClient) {
    this.loadCsv();

  }
  private loadCsv() {
    this.http.get('../assets/confirmed.csv', { responseType: 'text' }).subscribe(
      data => this.extractData(data)
    )
  }
  private extractData(res: string) {
    let csvData = res || '';
    this.papa.parse(csvData, {
      complete: parsedData => {
        this.rawCsvData = parsedData.data;
        let totalOfEach = 0;
        for (let j = 1; j < this.rawCsvData.length - 1; j++) {
          totalOfEach = 0;
          for (let i = 4; i < 577; i++) {
            totalOfEach = totalOfEach + +this.rawCsvData[j][i]
          }
          this.proccessedData.push([this.rawCsvData[j][1], totalOfEach]);
        }
        for (let i = 0; i < this.proccessedData.length - 1; i++) {
          if (this.proccessedData[i][0] === this.proccessedData[i + 1][0]) {
            console.log(this.proccessedData[i][0] + ' : ' + this.proccessedData[i][1])
            console.log(this.proccessedData[i][1])
            console.log(this.proccessedData[i + 1][1])
            this.proccessedData[i][1] = this.proccessedData[i][1] + this.proccessedData[i + 1][1]
            this.proccessedData.splice(i + 1, 1);
            i--;
          }
        }
        console.log(this.proccessedData)
      }
    });
  }

  displayedColumns: string[] = ['Country', 'Cases'];
  dataSource = this.proccessedData;

  title = 'Stavid19';

}

