import { useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, Printer } from "lucide-react";
import QRCode from "qrcode";

interface QRCodeModalProps {
  student: any;
  onClose: () => void;
}

export default function QRCodeModal({ student, onClose }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQRCode = async () => {
    if (!canvasRef.current) return;
    
    try {
      await QRCode.toCanvas(canvasRef.current, student.qrCode, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleDownload = async () => {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(student.qrCode, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      const link = document.createElement('a');
      link.href = qrCodeDataURL;
      link.download = `QR_${student.nis}_${student.name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrCodeDataURL = canvasRef.current?.toDataURL();
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${student.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
            }
            .qr-container {
              border: 2px solid #ccc;
              padding: 20px;
              margin: 20px auto;
              width: fit-content;
              border-radius: 10px;
            }
            .student-info {
              margin-bottom: 20px;
            }
            .student-info h2 {
              margin: 0 0 10px 0;
              color: #1976D2;
            }
            .student-info p {
              margin: 5px 0;
              color: #666;
            }
            .qr-code {
              margin: 20px 0;
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="student-info">
              <h2>${student.name}</h2>
              <p>NIS: ${student.nis}</p>
              <p>Kelas: ${student.class}</p>
            </div>
            <div class="qr-code">
              <img src="${qrCodeDataURL}" alt="QR Code" style="width: 200px; height: 200px;" />
            </div>
            <div class="footer">
              <p>Sistem Absensi Siswa</p>
              <p>QR Code: ${student.qrCode}</p>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  // Generate QR code when component mounts
  useEffect(() => {
    generateQRCode();
  }, [student]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            QR Code Siswa
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-qr-modal">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="text-center p-6">
          <div className="mb-4">
            <p className="font-medium text-gray-900" data-testid="qr-student-name">{student.name}</p>
            <p className="text-sm text-gray-600" data-testid="qr-student-nis">NIS: {student.nis}</p>
            <p className="text-sm text-gray-600" data-testid="qr-student-class">{student.class}</p>
          </div>

          {/* QR Code Display */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <canvas
              ref={canvasRef}
              className="mx-auto border-2 border-gray-200 rounded-lg bg-white"
              data-testid="qr-code-canvas"
            />
            <p className="text-xs text-gray-500 mt-2" data-testid="qr-code-data">
              {student.qrCode}
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handlePrint}
              className="flex-1 bg-green-600 text-white hover:bg-green-700"
              data-testid="button-print-qr"
            >
              <Printer className="h-4 w-4 mr-2" />
              Cetak
            </Button>
            <Button
              onClick={handleDownload}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              data-testid="button-download-qr"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
