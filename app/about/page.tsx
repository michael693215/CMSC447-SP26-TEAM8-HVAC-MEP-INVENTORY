import Layout from '../layout'

export default function AboutPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white shadow-md rounded-lg">

        <h1 className="text-3xl font-bold mb-4">About</h1>
        <p className="text-gray-600 mb-6">
          This HVAC dashboard helps manage inventory, work orders, and customer data.
        </p>
      </div>
    </div>

  );
}