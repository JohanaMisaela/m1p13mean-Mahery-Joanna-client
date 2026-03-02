import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, OrderItem } from '../../shared/models/order.model';
import { formatDate, registerLocaleData, CurrencyPipe } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

registerLocaleData(localeFr, 'fr-FR');

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private currencyPipe = new CurrencyPipe('fr-FR');

  constructor() {}

  async generateInvoice(order: Order) {
    const doc = new jsPDF();
    const shop = order.shop;
    const user = order.user;
    const address = order.shippingAddress;
    const primaryColor = [31, 41, 55];

    // Pre-fetch all product images
    const itemImages = await Promise.all(
      order.items.map(async (item) => {
        const imageUrl = item.variant?.images?.[0] || item.product?.images?.[0];
        if (imageUrl) {
          try {
            return await this.getBase64ImageFromUrl(imageUrl);
          } catch (e) {
            return null;
          }
        }
        return null;
      }),
    );

    // --- Modern Header ---
    // Shop Logo (Top Left)
    if (shop?.logo) {
      try {
        const logoData = await this.getBase64ImageFromUrl(shop.logo);
        doc.addImage(logoData, 'JPEG', 15, 15, 25, 25);
      } catch (e) {}
    }

    // Shop Info (Beside Logo)
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(shop?.name?.toUpperCase() || 'E-COMMERCE', 45, 26);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120);
    doc.text(shop?.slogan || '', 45, 31);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    const shopInfoLine = [
      shop?.mallBoxNumber ? `Box ${shop.mallBoxNumber}` : '',
      shop?.phone ? `Tél: ${shop.phone}` : '',
      shop?.email ? `Email: ${shop.email}` : '',
    ]
      .filter(Boolean)
      .join('  |  ');
    doc.text(shopInfoLine, 45, 37);

    // Invoice Meta (Top Right)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('FACTURE', 195, 20, { align: 'right' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Référence : #${order._id.slice(-8).toUpperCase()}`, 195, 25, { align: 'right' });
    doc.text(`Date : ${formatDate(order.createdAt, 'dd/MM/yyyy HH:mm', 'fr-FR')}`, 195, 30, {
      align: 'right',
    });

    // Decorative line
    doc.setDrawColor(230);
    doc.setLineWidth(0.5);
    doc.line(15, 45, 195, 45);

    // --- Billing Details ---
    const detailY = 55;

    // Destinataire (Left)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(150);
    doc.text('CLIENT', 15, detailY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

    // Safety check for user object
    const clientName =
      typeof user === 'object' && user
        ? `${user.name || ''} ${user.surname || ''}`.trim()
        : 'Client';
    doc.text(clientName.toUpperCase(), 15, detailY + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    if (user?.email) doc.text(user.email, 15, detailY + 11);
    const contact = user?.contact || user?.phone;
    if (contact) doc.text(contact, 15, detailY + 16);

    // Shipping (Right)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(150);
    doc.text('ADRESSE DE LIVRAISON', 110, detailY);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(address?.street || '', 110, detailY + 6);
    doc.text(`${address?.zip || ''} ${address?.city || ''}`, 110, detailY + 11);
    doc.text(address?.country || 'Madagascar', 110, detailY + 16);

    // --- Items Table ---
    const tableData = order.items.map((item: OrderItem, index) => {
      const attributes = this.getAttributesString(item.variant?.attributes);
      const productName = item.product.name + (attributes ? `\n(${attributes})` : '');
      const unitPrice = this.formatCurrency(item.price);
      const discount =
        item.promotionDiscount || item.promotion?.discountPercentage
          ? `-${item.promotionDiscount || item.promotion?.discountPercentage}%`
          : '-';

      return [
        '', // Space for image
        productName,
        item.quantity.toString(),
        unitPrice,
        discount,
        this.formatCurrency(item.price * item.quantity),
      ];
    });

    autoTable(doc, {
      startY: 85,
      head: [['', 'Désignation', 'Qté', 'Prix Unit.', 'Remise', 'Total']],
      body: tableData,
      foot: [
        [
          {
            content: 'TOTAL À PAYER',
            colSpan: 5,
            styles: {
              halign: 'right',
              fontStyle: 'normal',
              fontSize: 9,
              textColor: [31, 41, 55],
              fillColor: [255, 255, 255],
              lineWidth: 0.1,
            },
          },
          {
            content: this.formatCurrency(order.totalAmount),
            styles: {
              halign: 'right',
              fontStyle: 'bold',
              fontSize: 13,
              textColor: [0, 0, 0],
              fillColor: [255, 255, 255],
              lineWidth: 0.1,
            },
          },
        ],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [31, 41, 55],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        fontSize: 8,
        cellPadding: 4,
        overflow: 'linebreak',
        valign: 'middle',
        textColor: [50, 50, 50],
      },
      columnStyles: {
        0: { cellWidth: 20 }, // Image
        1: { cellWidth: 'auto' },
        2: { cellWidth: 22, halign: 'center' }, // Much wider as requested
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 30, halign: 'right' },
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          const imgData = itemImages[data.row.index];
          if (imgData) {
            const imgSize = 12;
            const x = data.cell.x + (data.cell.width - imgSize) / 2;
            const y = data.cell.y + (data.cell.height - imgSize) / 2;
            doc.addImage(imgData, 'JPEG', x, y, imgSize, imgSize);
          }
        }
      },
      margin: { left: 15, right: 15 },
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'italic');
    doc.text('Merci pour votre confiance !', 105, 280, { align: 'center' });

    // Save
    doc.save(`Facture_${order._id.slice(-8).toUpperCase()}.pdf`);
  }

  private formatCurrency(amount: number): string {
    // Standardizing the number format to avoid weird spaces or glyphs in jsPDF
    const val = Math.round(amount);
    const formatted = val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formatted} Ar`;
  }

  private getAttributesString(attributes: any): string {
    if (!attributes) return '';
    if (Array.isArray(attributes)) {
      return attributes.map((attr) => `${attr.name}: ${attr.value}`).join(', ');
    }
    return Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }

  private getBase64ImageFromUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      img.onerror = (error) => reject(error);
      img.src = url;
    });
  }
}
