'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getUserData, editName, editEmail, editRole, editPassword, editActive } from './actions'
import { Employee } from '@/components/columns/Employee'
import { Role } from '@/lib/types'
import IconComponent from '@/components/ui/IconComponent'
import ModalComponent from '@/components/ui/ModalComponent'
import { FaEdit } from 'react-icons/fa'

export default function UserPage()
{
    const router = useRouter();
    const params = useParams();
    const id : string = params.id as string; // profile
    const [data, setData] = useState<Employee | null>(null);
    const [role, setRole] = useState<Role | null>(null); // yours
    const [uid, setUid] = useState<string | null>(null); // yours
    const [modalResult, setModalResult] = useState<{success: boolean, error?: string} | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function getData()
        {
            setData(await getUserData(id));
            const yourData = await getUserData();
            setRole(yourData?.role as Role);
            setUid(yourData?.id as string);
            setIsLoading(false);
        }
        getData();
    }, [])

    useEffect(() => {
        if (!isLoading && !data)
        {
            router.back();
        }
    }, [isLoading, data, router]);


    if (isLoading) 
    {
        return (<div className="flex justify-center min-h-screen items-center">Loading employee data...</div>);
    }
    else if (!data) 
    { 
        return (<div className="flex justify-center min-h-screen items-center">Employee data unavailable. Redirecting...</div>) 
    } 
    else if (!role || !uid)
    {
        return (<div className="flex justify-center min-h-screen items-center">You lack sufficient permissions to view this page. Redirecting...</div>) 
    }

    return (
        <div className="min-h-screen p-8 text-black">
            <div className="max-w-2xl mx-auto">
                <button className="text-blue-600 hover:underline mb-4 inline-block font-medium" onClick={ router.back }>
                    ← Back
                </button>
                <div className="mb-6">
                    <h1 className= { "w-fit flex flex-row text-3xl font-bold tracking-tight gap-2" }>
                        <p>User:</p>
                        <div className= { `rounded-2xl ${ data.is_active ? 'bg-green-200' : 'bg-red-200'}` }>
                            { [data?.first_name, data?.last_name].join(' ') } 
                            { data.is_active && <ModalComponent 
                                icon={ FaEdit }
                                title="Change Name">
                                {(close) => (
                                    <form className='flex flex-col gap-4' onSubmit={ async (e: React.FormEvent<HTMLFormElement>) => { 
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);
                                        const firstName : string | undefined = formData.get('first_name') as string !== data.first_name ? formData.get('first_name') as string : undefined;
                                        const lastName : string | undefined = formData.get('last_name') as string !== data.last_name ? formData.get('last_name') as string : undefined;
                                        const result = await editName(id, firstName, lastName);
                                        setModalResult(result);
                                        if (result.success) 
                                        {
                                            setModalResult(null);
                                            close();
                                        } 
                                        } }>
                                        <label>First Name:</label>
                                        <input 
                                            name='first_name'
                                            type="text" 
                                            defaultValue={ data.first_name }
                                            className="w-full border p-2"
                                            required/>
                                        <label>Last Name:</label>
                                        <input 
                                            name='last_name'
                                            type="text" 
                                            defaultValue={ data.last_name || '' }
                                            className="w-full border p-2"/>
                                        { modalResult && (!modalResult.success && <p className='text-red-600'>{ modalResult.error }</p>) }
                                        <div className='flex justify-end gap-4'>
                                            <button className='w-min btn-secondary' type='button' onClick={ () => { setModalResult(null); close(); } }>Cancel</button> 
                                            <button className='w-min btn-accent' type='submit'>Submit</button>
                                        </div>
                                    </form> )}
                            </ModalComponent> } 
                        </div>
                    </h1>
                </div>
                <div className="flex flex-col bg-white rounded-2xl border border-gray-200 shadow-md p-8">
                    <div className='flex flex-row items-center'>
                        <p>Email: { data.email }</p>
                        { data.is_active && <ModalComponent 
                            icon={ FaEdit }
                            title="Change Email">
                            {(close) => (
                                <form className='flex flex-col gap-4' onSubmit={ async (e: React.FormEvent<HTMLFormElement>) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const email : string | undefined = formData.get('email') as string !== data.email ? formData.get('email') as string : undefined;
                                    const result = await editEmail(id, email); 
                                    setModalResult(result);
                                    if (result.success)
                                    {
                                        setModalResult(null);
                                        close();
                                    }
                                } }>
                                    <label>New Email:</label>
                                    <input 
                                        name='email'
                                        type="email" 
                                        defaultValue={ data.email }
                                        className="w-full border p-2"/>
                                    { modalResult && (!modalResult.success && <p className='text-red-600'>{ modalResult.error }</p>) }
                                    <div className='flex justify-end gap-4'>
                                        <button className='w-min btn-secondary' onClick={ () => { setModalResult(null); close(); } }>Cancel</button> 
                                        <button className='w-min btn-accent' type='submit'>Submit</button>
                                    </div>
                                </form> )}
                        </ModalComponent> } 
                    </div>
                    <div className='flex flex-row items-center'>
                        <p> Role: { data.role }</p>
                        { data.is_active && <ModalComponent 
                            icon={ FaEdit }
                            title="Change Role">
                            {(close) => (
                                <form className='flex flex-col gap-4' onSubmit={ async (e: React.FormEvent<HTMLFormElement>) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const role : string | undefined = formData.get('role') as string !== data.role ? formData.get('role') as string : undefined;
                                    const result = await editRole(id, role); 
                                    setModalResult(result);
                                    if (result.success)
                                    {
                                        setModalResult(null);
                                        close();
                                    }
                                } }>
                                    <label>Select Role:</label>
                                    <select 
                                        name='role' 
                                        defaultValue={ data.role }
                                        className="w-full border p-2">
                                        <option value="administrator">ADMINISTRATOR</option>
                                        <option value="project_manager">PROJECT MANAGER</option>
                                        <option value="logistician">LOGISTICIAN</option>
                                        <option value="foreman">FOREMAN</option>
                                    </select>
                                    { modalResult && (!modalResult.success && <p className='text-red-600'>{ modalResult.error }</p>) }
                                    <div className='flex justify-end gap-4'>
                                        <button className='w-min btn-secondary' onClick={ () => { setModalResult(null); close(); } }>Cancel</button> 
                                        <button className='w-min btn-accent' type='submit'>Submit</button>
                                    </div>
                                </form> )}
                        </ModalComponent> } 
                    </div>
                </div>
                <div className='flex flex-row hover:cursor-default justify-end gap-4'>
                    <div className='hover:text-blue-600'>
                        { data.is_active && <ModalComponent 
                            icon={ 'Change Password' }
                            title="Change Password">
                            {(close) => (
                                <form className='flex flex-col gap-4' onSubmit={ async (e: React.FormEvent<HTMLFormElement>) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const password : string = formData.get('password') as string;  
                                    const result = await editPassword(id, password); 
                                    setModalResult(result);
                                    if (result.success)
                                    {
                                        setModalResult(null);
                                        close();
                                    }
                                } }>
                                    <label>New Password:</label>
                                    <input 
                                        name='password'
                                        placeholder='new password'
                                        type='password'
                                        className="w-full border p-2"
                                        required/>
                                    { modalResult && (!modalResult.success && <p className='text-red-600'>{ modalResult.error }</p>) }
                                    <div className='flex justify-end gap-4'>
                                        <button className='w-min btn-secondary' onClick={ () => { setModalResult(null); close(); } }>Cancel</button> 
                                        <button className='w-min btn-accent' type='submit'>Submit</button>
                                    </div>
                                </form> )}
                        </ModalComponent> } 

                    </div>
                    { role == 'administrator' && uid != data.id && (
                        <div className='hover:text-blue-600'>
                            { <ModalComponent 
                                icon={ data.is_active ? 'Deactivate' : 'Activate' }
                                title={ data.is_active ? 'Deactivate' : 'Activate' }>
                                {(close) => (
                                    <form className='flex flex-col gap-4' onSubmit={ async (e: React.FormEvent<HTMLFormElement>) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const answer : boolean = (formData.get('confirmToggleActivation') as string).toLowerCase() === 'confirm' ? true : false;  
                                    const result = await editActive(answer, id, !data.is_active); 
                                    setModalResult(result);
                                    if (result.success)
                                    {
                                        setModalResult(null);
                                        close();
                                    }
                                } }>
                                        <label>Type "Confirm" to consolidate change:</label>
                                        <input 
                                            name='confirmToggleActivation'
                                            type='text'
                                            placeholder='Confirm'
                                            className="w-full border p-2"
                                            required/>

                                        { modalResult && (!modalResult.success && <p className='text-red-600'>{ modalResult.error }</p>) }
                                        <div className='flex justify-end gap-4'>
                                            <button className='w-min btn-secondary' onClick={ () => { setModalResult(null); close(); } }>Cancel</button> 
                                            <button className='w-min btn-accent' type='submit'>Submit</button>
                                        </div>
                                    </form> )}
                            </ModalComponent> } 
                        </div>) }
                    </div>
            </div>
        </div>
    );
}