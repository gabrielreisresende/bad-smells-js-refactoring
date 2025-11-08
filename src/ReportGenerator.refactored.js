const ADMIN_PRIORITY_LIMIT = 1000;
const USER_VIEW_LIMIT = 500;

class BaseReportStrategy {
  constructor(user, reportType) {
    this.user = user;
    this.reportType = reportType;
    this.total = 0;
    this.report = '';
  }

  generate(items) {
    this.addHeader();
    this.addBody(items);
    this.addFooter();
    return this.report.trim();
  }

  addHeader() { }
  addBody() { }
  addFooter() { }
  addLine() { }

  addCSVLine(item) {
    this.report += `${item.id},${item.name},${item.value},${this.user.name}\n`;
    this.total += item.value;
  }

  addHTMLRow(item, extraStyle = '') {
    const styleAttribute = extraStyle ? ` ${extraStyle}` : '';
    this.report += `<tr${styleAttribute}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
    this.total += item.value;
  }

  isCSV() {
    return this.reportType === 'CSV';
  }
}


class AdminReportStrategy extends BaseReportStrategy {
  addHeader() {
    if (this.reportType === 'CSV') {
      this.report += 'ID,NOME,VALOR,USUARIO\n';
    } else if (this.reportType === 'HTML') {
      this.report += '<html><body>\n';
      this.report += '<h1>Relatório</h1>\n';
      this.report += `<h2>Usuário: ${this.user.name}</h2>\n`;
      this.report += '<table>\n<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n';
    }
  }

  addBody(items) {
    for (const item of items) {
      const isPriority = item.value > ADMIN_PRIORITY_LIMIT;
      if (this.reportType === 'CSV') {
        this.addCSVLine(item);
      } else if (this.reportType === 'HTML') {
        const style = isPriority ? 'style="font-weight:bold;"' : '';
        this.addHTMLRow(item, style);
      }
    }
  }

  addFooter() {
    if (this.reportType === 'CSV') {
      this.report += `\nTotal,,\n${this.total},,\n`;
    } else if (this.reportType === 'HTML') {
      this.report += `</table>\n<h3>Total: ${this.total}</h3>\n</body></html>\n`;
    }
  }
}


class UserReportStrategy extends BaseReportStrategy {
  addHeader() {
    if (this.isCSV()) {
      this.report += 'ID,NOME,VALOR,USUARIO\n';
    } else if (this.reportType === 'HTML') {
      this.report += '<html><body>\n';
      this.report += '<h1>Relatório</h1>\n';
      this.report += `<h2>Usuário: ${this.user.name}</h2>\n`;
      this.report += '<table>\n<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n';
    }
  }

  addBody(items) {
    const filteredItems = items.filter((item) => item.value <= USER_VIEW_LIMIT);
    for (const item of filteredItems) {
      if (this.reportType === 'CSV') {
        this.addCSVLine(item);
      } else if (this.reportType === 'HTML') {
        this.addHTMLRow(item);
      }
    }
  }

  addFooter() {
    if (this.isCSV()) {
      this.report += `\nTotal,,\n${this.total},,\n`;
    } else if (this.reportType === 'HTML') {
      this.report += `</table>\n<h3>Total: ${this.total}</h3>\n</body></html>\n`;
    }
  }

}

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Gera um relatório baseado no tipo e no perfil do usuário.
   * Admins veem todos os itens.
   * Usuários comuns veem apenas itens de valor <= 500.
   */
  generateReport(reportType, user, items) {
    const strategy = this.getStrategy(user, reportType);
    return strategy.generate(items);
  }

  getStrategy(user, reportType) {
    if (user.role === 'ADMIN') {
      return new AdminReportStrategy(user, reportType);
    }
    return new UserReportStrategy(user, reportType);
  }
}