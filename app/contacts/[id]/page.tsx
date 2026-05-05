import Link from 'next/link'

export default function UserPage()
{

    return (
        <div className='min-h-screen bg-gray-100 p-8'> 
            <div className="max-w-2xl mx-auto">
                <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
                    ← Back
                </Link>
                <div className="mb-6">
                    <h1 className="text-3xl font-bold uppercase tracking-tight">Add User</h1>
                    <p className="text-gray-500 mt-1 text-sm">Fill out the form below to add a new user.</p>
                </div>
            </div>
 
        </div>
    )
}