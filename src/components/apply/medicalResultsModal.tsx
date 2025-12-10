import React from "react";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  message: string;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative overflow-hidden">

        {/* Decorative Top Banner */}
        <div className="absolute top-0 left-0 w-full h-2 bg-[#0056D2]" />

        {/* Header Section */}
        <h3 className="text-2xl font-bold text-[#0056D2] text-center">
          Save More with COVA
        </h3>

        {/* Message */}
        <p className="text-gray-700 text-center mt-3 leading-relaxed">
          {message}
        </p>

        {/* Drug Savings Table */}
        <div className="mt-6">
          
          <table className="w-full border border-gray-300 rounded-lg overflow-hidden text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Drug</th>
                <th className="border p-2 text-center">Market Price</th>
                <th className="border p-2 text-center text-[#0056D2]">COVA Price</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">Amoxicillin 500mg</td>
                <td className="border p-2 text-center">KES 650</td>
                <td className="border p-2 text-center text-[#0056D2] font-semibold">KES 420</td>
              </tr>
              <tr>
                <td className="border p-2">Paracetamol 500mg</td>
                <td className="border p-2 text-center">KES 120</td>
                <td className="border p-2 text-center text-[#0056D2] font-semibold">KES 70</td>
              </tr>
              <tr>
                <td className="border p-2">Azithromycin 250mg</td>
                <td className="border p-2 text-center">KES 950</td>
                <td className="border p-2 text-center text-[#0056D2] font-semibold">KES 680</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Promo Text */}
        <div className="mt-6 text-center text-gray-700 space-y-2">

          <p>
            For every amount you put, you get up to{" "}
            <span className="font-bold text-[#0056D2]">4× value</span> back in health benefits.
          </p>

          <p>
            Share your benefits with family members and loved ones —{" "}
            <span className="font-semibold text-[#0056D2]">and best part, they never expire</span>.
          </p>
        </div>

        {/* Illustration */}
        <div className="flex justify-center mt-4">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3209/3209265.png"
            alt="Health Savings"
            className="w-24 h-24 opacity-90"
          />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 mt-6">

          {/* Enroll into COVA */}
          <a
            href="https://cova.checkupsmed.com/"
            className="px-6 py-3 rounded-xl bg-[#0056D2] text-white font-semibold shadow hover:bg-[#0048ae] transition w-full inline-block text-center"
          >
            Enroll Into COVA
          </a>

          {/* Continue Assessment */}
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition w-full"
          >
            Don’t currently have money? Continue with Health Now, Pay Later to access low cost medical loan
          </button>

        </div>

      </div>
    </div>
  );
};
