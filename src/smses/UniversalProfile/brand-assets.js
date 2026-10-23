import { useEffect, useState } from "react"
import { Upload, X, Check } from "lucide-react"
import { db, auth, storage } from '../../firebaseConfig';
import { getProfileOwnerId } from "../../utils/profile-context"
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { uploadDocumentWithSync, deleteDocumentWithSync, getDocumentUrlFromAnyLocation } from '../../utils/documentSyncService';
import { validateDocument, validateCompanyDocument } from '../../services/documentValidationService';

function FormField({ label, required, children }) {
    return (
        <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                {label} {required && <span style={{ color: 'red' }}>*</span>}
            </label>
            {children}
        </div>
    )
}

function SectionHeading({ title }) {
    return (
        <div style={{
            borderBottom: '2px solid #C19A6B',
            marginBottom: '1.25rem',
            marginTop: '1.75rem',
            paddingBottom: '6px',
        }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#6B3410', margin: 0, letterSpacing: '0.3px' }}>
                {title}
            </h3>
        </div>
    )
}

function RadioGroup({ name, value, onChange }) {
    return (
        <div style={{ display: 'flex', gap: '24px', marginTop: '6px' }}>
            {["yes", "no"].map((val) => (
                <label
                    key={val}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#3d2b1f',
                    }}
                >
                    <input
                        type="radio"
                        name={name}
                        value={val}
                        checked={value === val}
                        onChange={(e) => onChange(e.target.value)}
                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, margin: 0 }}
                    />
                    <div
                        style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: `2px solid ${value === val ? '#8B4513' : '#ccc'}`,
                            backgroundColor: value === val ? '#8B4513' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.15s ease',
                            boxShadow: value === val ? '0 0 0 3px rgba(139,69,19,0.12)' : 'none',
                        }}
                    >
                        {value === val && (
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'white' }} />
                        )}
                    </div>
                    <span style={{ textTransform: 'capitalize' }}>{val}</span>
                </label>
            ))}
        </div>
    )
}

export default function BrandAssets({ data = {}, updateData, isNGO = false }) {
    const [formData, setFormData] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [logoUploading, setLogoUploading] = useState(false)
    const [logoPreview, setLogoPreview] = useState("")
    const [letterheadUploading, setLetterheadUploading] = useState(false)
    const [letterheadFile, setLetterheadFile] = useState(null)
    const [orgStructureUploading, setOrgStructureUploading] = useState(false)

    const updateFormData = (newData) => {
        setFormData(newData)
        updateData(newData)
    }

    useEffect(() => {
        const loadBrandAssets = async () => {
            try {
                setIsLoading(true)
                const isOnboarding = sessionStorage.getItem("isOnboarding") === "true"
                if (isOnboarding) {
                    setFormData(data || {})
                    setIsLoading(false)
                    return
                }

                const userId = await getProfileOwnerId()
                if (!userId) { setIsLoading(false); return }

                const docRef = doc(db, "universalProfiles", userId)
                const docSnap = await getDoc(docRef)

                if (docSnap.exists()) {
                    const profileData = docSnap.data()
                    const brandData = profileData.brandAssets || {}

                    // Fallback: migrate from entityOverview if brandAssets doesn't exist yet
                    const entityOverview = profileData.entityOverview || {}
                    const companyLetterhead = getDocumentUrlFromAnyLocation('Company Letterhead', profileData)
                    const companyLogo = getDocumentUrlFromAnyLocation('Company Logo', profileData)
                    const orgStructure = getDocumentUrlFromAnyLocation('Org Structure', profileData)

                    updateFormData({
                        brandsOwned: brandData.brandsOwned || entityOverview.brandsOwned || "",
                        brandsRepresented: brandData.brandsRepresented || entityOverview.brandsRepresented || "",
                        holdsFranchises: brandData.holdsFranchises || entityOverview.holdsFranchises || "",
                        holdsAgencies: brandData.holdsAgencies || entityOverview.holdsAgencies || "",
                        companyLogo: companyLogo || brandData.companyLogo || "",
                        companyLetterhead: companyLetterhead || brandData.companyLetterhead || "",
                        orgStructure: orgStructure || brandData.orgStructure || "",
                    })
                } else {
                    updateFormData(data || {})
                }
            } catch (error) {
                console.error("Error loading brand assets:", error)
                updateFormData(data || {})
            } finally {
                setIsLoading(false)
            }
        }

        loadBrandAssets()
    }, [])

    const handleChange = (e) => {
        const { name, value } = e.target
        const newData = { ...formData, [name]: value }
        updateFormData(newData)
    }

    const handleRadioChange = (name, value) => {
        const newData = { ...formData, [name]: value }
        updateFormData(newData)
    }

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
            return
        }

        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
            alert('Image size must be less than 5MB')
            return
        }

        try {
            setLogoUploading(true)
            const currentUser = auth.currentUser
            if (!currentUser) throw new Error('User not authenticated')

            const previewURL = URL.createObjectURL(file)
            setLogoPreview(previewURL)

            const timestamp = Date.now()
            const fileName = `company_logos/${currentUser.uid}/${timestamp}_${file.name}`
            const storageRef = ref(storage, fileName)
            const uploadResult = await uploadBytes(storageRef, file)
            const downloadURL = await getDownloadURL(uploadResult.ref)

            try {
                const validationResult = await validateDocument('Company Logo', file, "")
                if (validationResult.isValid) {
                    await uploadDocumentWithSync('Company Logo', downloadURL, validationResult)
                } else {
                    await uploadDocumentWithSync('Company Logo', downloadURL, { status: 'warning', message: 'Logo uploaded without AI validation' })
                }
            } catch (validationError) {
                console.warn('Logo validation failed, proceeding with upload:', validationError)
                await uploadDocumentWithSync('Company Logo', downloadURL, { status: 'warning', message: 'Logo uploaded without AI validation' })
            }

            const userDocRef = doc(db, "universalProfiles", await getProfileOwnerId())
            const currentProfileDoc = await getDoc(userDocRef)
            const currentData = currentProfileDoc.exists() ? currentProfileDoc.data() : {}

            await updateDoc(userDocRef, {
                brandAssets: { ...(currentData.brandAssets || {}), companyLogo: downloadURL },
                updatedAt: new Date().toISOString()
            })

            const newFormData = { ...formData, companyLogo: downloadURL }
            updateFormData(newFormData)

            if (currentData.brandAssets?.companyLogo &&
                currentData.brandAssets.companyLogo !== downloadURL &&
                currentData.brandAssets.companyLogo.includes('firebase')) {
                try {
                    const oldImageRef = ref(storage, currentData.brandAssets.companyLogo)
                    await deleteObject(oldImageRef)
                } catch (deleteError) {
                    console.warn('Could not delete old logo:', deleteError)
                }
            }

        } catch (error) {
            console.error('Error uploading logo:', error)
            alert('Failed to upload logo. Please try again.')
            setLogoPreview("")
        } finally {
            setLogoUploading(false)
        }
    }

    const handleRemoveLogo = async () => {
        try {
            const confirmDelete = window.confirm('Are you sure you want to delete the Company Logo?')
            if (!confirmDelete) return

            await deleteDocumentWithSync('Company Logo')

            const currentUser = auth.currentUser
            if (!currentUser) return

            const userDocRef = doc(db, "universalProfiles", await getProfileOwnerId())
            const currentProfileDoc = await getDoc(userDocRef)
            const currentData = currentProfileDoc.exists() ? currentProfileDoc.data() : {}

            await updateDoc(userDocRef, {
                brandAssets: { ...(currentData.brandAssets || {}), companyLogo: "" },
                updatedAt: new Date().toISOString()
            })

            const newFormData = { ...formData }
            delete newFormData.companyLogo
            updateFormData(newFormData)
            setLogoPreview("")
            alert('Company Logo deleted successfully!')
        } catch (error) {
            console.error('Error removing logo:', error)
            alert('Failed to remove logo. Please try again.')
        }
    }

    const handleLetterheadUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
        const fileExtension = file.name.toLowerCase().split('.').pop()
        if (!allowedTypes.includes(`.${fileExtension}`)) {
            alert(`Please upload only PDF, Word, or Image files.`)
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('File size exceeds 10MB limit.')
            return
        }

        try {
            setLetterheadUploading(true)
            const currentUser = auth.currentUser
            if (!currentUser) throw new Error('User not authenticated')

            const userDocRef = doc(db, "universalProfiles", await getProfileOwnerId())
            const userDoc = await getDoc(userDocRef)
            const registeredName = userDoc.exists() ? userDoc.data()?.entityOverview?.registeredName || "" : ""

            const validationResult = await validateCompanyDocument('Company Letterhead', file, registeredName)
            if (!validationResult.isValid) {
                alert(`Validation failed: ${validationResult.message}`)
                setLetterheadUploading(false)
                return
            }

            const timestamp = Date.now()
            const storageRef = ref(storage, `company_letterhead/${currentUser.uid}/${timestamp}_${file.name}`)
            const uploadResult = await uploadBytes(storageRef, file)
            const downloadURL = await getDownloadURL(uploadResult.ref)

            await uploadDocumentWithSync('Company Letterhead', downloadURL, validationResult)

            await updateDoc(userDocRef, {
                brandAssets: { ...(userDoc.data()?.brandAssets || {}), companyLetterhead: downloadURL },
                updatedAt: new Date().toISOString()
            })

            updateFormData({ ...formData, companyLetterhead: downloadURL })
            setLetterheadFile(file)
            alert('Company Letterhead uploaded and validated successfully!')
        } catch (error) {
            console.error('Error uploading letterhead:', error)
            alert('Failed to upload letterhead. Please try again.')
        } finally {
            setLetterheadUploading(false)
        }
    }

    const handleDeleteLetterhead = async () => {
        try {
            const confirmDelete = window.confirm('Are you sure you want to delete the Company Letterhead?')
            if (!confirmDelete) return
            await deleteDocumentWithSync('Company Letterhead')

            const userDocRef = doc(db, "universalProfiles", await getProfileOwnerId())
            const userDoc = await getDoc(userDocRef)
            await updateDoc(userDocRef, {
                brandAssets: { ...(userDoc.data()?.brandAssets || {}), companyLetterhead: "" },
                updatedAt: new Date().toISOString()
            })

            const newFormData = { ...formData }
            delete newFormData.companyLetterhead
            updateFormData(newFormData)
            setLetterheadFile(null)
            alert('Company Letterhead deleted successfully!')
        } catch (error) {
            console.error('Error deleting letterhead:', error)
            alert('Failed to delete letterhead. Please try again.')
        }
    }

    const handleOrgStructureUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xlsx', '.xls']
        const fileExtension = file.name.toLowerCase().split('.').pop()
        if (!allowedTypes.includes(`.${fileExtension}`)) {
            alert('Please upload a PDF, Word, Excel, or Image file.')
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('File size exceeds 10MB limit.')
            return
        }

        try {
            setOrgStructureUploading(true)
            const currentUser = auth.currentUser
            if (!currentUser) throw new Error('User not authenticated')

            const timestamp = Date.now()
            const storageRef = ref(storage, `org_structure/${currentUser.uid}/${timestamp}_${file.name}`)
            const uploadResult = await uploadBytes(storageRef, file)
            const downloadURL = await getDownloadURL(uploadResult.ref)

            await uploadDocumentWithSync('Org Structure', downloadURL, { status: 'ok', message: 'Org structure uploaded' })

            const userDocRef = doc(db, "universalProfiles", await getProfileOwnerId())
            const userDoc = await getDoc(userDocRef)
            await updateDoc(userDocRef, {
                brandAssets: { ...(userDoc.data()?.brandAssets || {}), orgStructure: downloadURL },
                updatedAt: new Date().toISOString()
            })

            updateFormData({ ...formData, orgStructure: downloadURL })
            alert('Org structure uploaded successfully!')
        } catch (error) {
            console.error('Error uploading org structure:', error)
            alert('Failed to upload org structure. Please try again.')
        } finally {
            setOrgStructureUploading(false)
        }
    }

    const handleDeleteOrgStructure = async () => {
        try {
            const confirmDelete = window.confirm('Are you sure you want to delete the Org Structure?')
            if (!confirmDelete) return
            await deleteDocumentWithSync('Org Structure')

            const userDocRef = doc(db, "universalProfiles", await getProfileOwnerId())
            const userDoc = await getDoc(userDocRef)
            await updateDoc(userDocRef, {
                brandAssets: { ...(userDoc.data()?.brandAssets || {}), orgStructure: "" },
                updatedAt: new Date().toISOString()
            })

            const newFormData = { ...formData }
            delete newFormData.orgStructure
            updateFormData(newFormData)
            alert('Org structure deleted successfully!')
        } catch (error) {
            console.error('Error deleting org structure:', error)
            alert('Failed to delete org structure. Please try again.')
        }
    }

    const inputStyle = {
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '14px',
    }

    const spinnerStyle = {
        width: '16px', height: '16px',
        border: '2px solid transparent',
        borderTop: '2px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    }

    if (isLoading) {
        return (
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Brand Assets</h2>
                <p>Loading your information...</p>
            </div>
        )
    }

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Brand Assets</h2>

            {/* Brands, Franchises & Agencies */}
            <SectionHeading title={isNGO ? "Organisation Brand Assets" : "Brands & Representation"} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '1.5rem' }}>
                <FormField label={isNGO ? "Programmes or Initiatives Owned" : "Brands Owned"}>
                    <input
                        type="text"
                        name="brandsOwned"
                        value={formData.brandsOwned || ""}
                        onChange={handleChange}
                        style={inputStyle}
                        placeholder={isNGO ? "e.g., ReadToLead, TechForGirls" : "e.g., Brand A, Brand B"}
                    />
                </FormField>

                <FormField label={isNGO ? "Affiliated Global / Partner Initiatives" : "Brands Represented"}>
                    <input
                        type="text"
                        name="brandsRepresented"
                        value={formData.brandsRepresented || ""}
                        onChange={handleChange}
                        style={inputStyle}
                        placeholder={isNGO ? "e.g., Global Giving Partner, UNESCO Linked" : "e.g., Brand X, Brand Y"}
                    />
                </FormField>

                <FormField label={isNGO ? "Holds Accreditations / Franchises?" : "Do you hold any Franchises?"}>
                    <RadioGroup
                        name="holdsFranchises"
                        value={formData.holdsFranchises}
                        onChange={(value) => handleRadioChange("holdsFranchises", value)}
                    />
                </FormField>

                <FormField label={isNGO ? "Represents Donor / Global Agencies?" : "Do you hold any Agencies?"}>
                    <RadioGroup
                        name="holdsAgencies"
                        value={formData.holdsAgencies}
                        onChange={(value) => handleRadioChange("holdsAgencies", value)}
                    />
                </FormField>
            </div>

            {/* Company Logo, Org Structure, Letterhead */}
            <SectionHeading title={isNGO ? "Organisation Documents & Logos" : "Brand Documents & Logos"} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {/* Company Logo */}
                <FormField label={isNGO ? "Organisation Logo" : "Company Logo"}>
                    <div style={{
                        border: '2px dashed #C19A6B', borderRadius: '8px', padding: '16px',
                        backgroundColor: '#FAF8F5',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden',
                                border: '3px solid #8B6F47', backgroundColor: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(139,111,71,0.2)', flexShrink: 0,
                            }}>
                                {formData.companyLogo || logoPreview ? (
                                    <img src={logoPreview || formData.companyLogo} alt="Company Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ color: '#A0826D', fontSize: '10px', textAlign: 'center', padding: '6px' }}>
                                        <div style={{ fontSize: '28px', lineHeight: '1' }}>🏢</div>
                                        <div style={{ fontWeight: '600', color: '#8B6F47', fontSize: '9px' }}>No Logo</div>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <label htmlFor="logo-upload" style={{
                                        padding: '10px 16px',
                                        background: logoUploading ? 'linear-gradient(135deg,#A0826D,#8B6F47)' : 'linear-gradient(135deg,#8B4513,#6B3410)',
                                        color: 'white', border: 'none', borderRadius: '5px', fontSize: '13px', fontWeight: '600',
                                        cursor: logoUploading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
                                        opacity: logoUploading ? 0.7 : 1,
                                    }}>
                                        {logoUploading ? <><div style={spinnerStyle}></div>Uploading...</> : <><Upload size={16} />{formData.companyLogo ? 'Replace' : 'Upload'}</>}
                                        <input id="logo-upload" type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleLogoUpload} disabled={logoUploading} style={{ display: 'none' }} />
                                    </label>
                                    {(formData.companyLogo || logoPreview) && (
                                        <button type="button" onClick={handleRemoveLogo} style={{
                                            padding: '10px 16px', background: 'linear-gradient(135deg,#B8860B,#996515)', color: 'white',
                                            border: 'none', borderRadius: '5px', cursor: 'pointer',
                                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                                        }}>
                                            <X size={16} />Delete
                                        </button>
                                    )}
                                </div>
                                <div style={{
                                    fontSize: '11px', color: '#8B6F47', lineHeight: '1.4',
                                    backgroundColor: 'rgba(139,111,71,0.08)', padding: '8px 10px',
                                    borderRadius: '5px', border: '1px solid rgba(139,111,71,0.15)',
                                }}>
                                    <div style={{ fontWeight: '600', marginBottom: '2px' }}>📋 Requirements</div>
                                    <div>JPG, PNG, GIF, WebP • Max 5MB</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </FormField>

                {/* Organisational Structure */}
                <FormField label={isNGO ? "Organisational / Governance Structure Chart" : "Organisational Structure (optional)"}>
                    <div style={{
                        border: '2px dashed #C19A6B',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: '#FAF8F5',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '72px', height: '72px', borderRadius: '8px',
                                border: '3px solid #8B6F47', backgroundColor: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(139,111,71,0.2)', flexShrink: 0,
                            }}>
                                {formData.orgStructure ? (
                                    <div style={{ textAlign: 'center', padding: '6px' }}>
                                        <div style={{ fontSize: '28px', lineHeight: '1' }}>🗂️</div>
                                        <div style={{ fontSize: '9px', fontWeight: '600', color: '#8B6F47', marginTop: '2px' }}>Uploaded</div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '6px' }}>
                                        <div style={{ fontSize: '28px', lineHeight: '1' }}>📊</div>
                                        <div style={{ fontSize: '9px', fontWeight: '600', color: '#8B6F47', marginTop: '2px' }}>No File</div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <label
                                        htmlFor="org-structure-upload"
                                        style={{
                                            padding: '10px 16px',
                                            background: orgStructureUploading
                                                ? 'linear-gradient(135deg, #A0826D 0%, #8B6F47 100%)'
                                                : 'linear-gradient(135deg, #8B4513 0%, #6B3410 100%)',
                                            color: 'white', border: 'none', borderRadius: '5px',
                                            fontSize: '13px', fontWeight: '600',
                                            cursor: orgStructureUploading ? 'not-allowed' : 'pointer',
                                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                                            transition: 'all 0.3s ease',
                                            opacity: orgStructureUploading ? 0.7 : 1,
                                        }}
                                    >
                                        {orgStructureUploading ? (
                                            <><div style={spinnerStyle}></div> Uploading...</>
                                        ) : (
                                            <><Upload size={16} />{formData.orgStructure ? 'Replace' : 'Upload'}</>
                                        )}
                                        <input
                                            id="org-structure-upload"
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                                            onChange={handleOrgStructureUpload}
                                            disabled={orgStructureUploading}
                                            style={{ display: 'none' }}
                                        />
                                    </label>

                                    {formData.orgStructure && (
                                        <button
                                            type="button"
                                            onClick={handleDeleteOrgStructure}
                                            style={{
                                                padding: '10px 16px',
                                                background: 'linear-gradient(135deg, #B8860B 0%, #996515 100%)',
                                                color: 'white', border: 'none', borderRadius: '5px',
                                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
                                            }}
                                        >
                                            <X size={16} />Delete
                                        </button>
                                    )}
                                </div>

                                <div style={{
                                    fontSize: '11px', color: '#8B6F47', lineHeight: '1.4',
                                    backgroundColor: 'rgba(139,111,71,0.08)', padding: '8px 10px',
                                    borderRadius: '5px', border: '1px solid rgba(139,111,71,0.15)',
                                }}>
                                    {formData.orgStructure ? (
                                        <>
                                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>✅ Org Structure Uploaded</div>
                                            <a href={formData.orgStructure} target="_blank" rel="noopener noreferrer"
                                                style={{ color: '#8B4513', textDecoration: 'underline' }}>
                                                View Document ↗
                                            </a>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ fontWeight: '600', marginBottom: '2px' }}>📋 Accepted formats</div>
                                            <div>PDF, Word, Excel, Image • Max 10MB</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </FormField>

                {/* Company Letterhead */}
                <FormField label={isNGO ? "Official Organisation Letterhead" : "Company Letterhead"}>
                    <div style={{
                        border: '2px dashed #C19A6B', borderRadius: '8px', padding: '16px',
                        backgroundColor: '#FAF8F5',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden',
                                border: '3px solid #8B6F47', backgroundColor: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(139,111,71,0.2)', flexShrink: 0,
                            }}>
                                {formData.companyLetterhead ? (
                                    <div style={{ padding: '8px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '32px', lineHeight: '1', marginBottom: '4px' }}>📄</div>
                                        <div style={{ fontSize: '9px', fontWeight: '600', color: '#8B6F47' }}>Letterhead</div>
                                    </div>
                                ) : (
                                    <div style={{ color: '#A0826D', fontSize: '10px', textAlign: 'center', padding: '6px' }}>
                                        <div style={{ fontSize: '28px', lineHeight: '1', marginBottom: '2px' }}>📋</div>
                                        <div style={{ fontWeight: '600', color: '#8B6F47', fontSize: '9px' }}>No Letterhead</div>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <label htmlFor="letterhead-upload" style={{
                                        padding: '10px 16px',
                                        background: letterheadUploading ? 'linear-gradient(135deg,#A0826D,#8B6F47)' : 'linear-gradient(135deg,#8B4513,#6B3410)',
                                        color: 'white', border: 'none', borderRadius: '5px', fontSize: '13px', fontWeight: '600',
                                        cursor: letterheadUploading ? 'not-allowed' : 'pointer',
                                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                                        opacity: letterheadUploading ? 0.7 : 1,
                                    }}>
                                        {letterheadUploading ? <><div style={spinnerStyle}></div>Uploading...</> : <><Upload size={16} />{formData.companyLetterhead ? 'Replace' : 'Upload'}</>}
                                        <input id="letterhead-upload" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleLetterheadUpload} disabled={letterheadUploading} style={{ display: 'none' }} />
                                    </label>
                                    {formData.companyLetterhead && (
                                        <button type="button" onClick={handleDeleteLetterhead} style={{
                                            padding: '10px 16px', background: 'linear-gradient(135deg,#B8860B,#996515)', color: 'white',
                                            border: 'none', borderRadius: '5px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                                        }}>
                                            <X size={16} />Delete
                                        </button>
                                    )}
                                </div>
                                <div style={{
                                    fontSize: '11px', color: '#8B6F47', lineHeight: '1.4',
                                    backgroundColor: 'rgba(139,111,71,0.08)', padding: '8px 10px',
                                    borderRadius: '5px', border: '1px solid rgba(139,111,71,0.15)',
                                }}>
                                    {formData.companyLetterhead ? (
                                        <>
                                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>✅ Letterhead Uploaded</div>
                                            <a href={formData.companyLetterhead} target="_blank" rel="noopener noreferrer"
                                                style={{ color: '#8B4513', textDecoration: 'underline' }}>View Document ↗</a>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ fontWeight: '600', marginBottom: '2px' }}>📋 Requirements</div>
                                            <div>PDF, JPG, PNG • Max 10MB</div>
                                            <div style={{ marginTop: '2px' }}>Company name, logo, address, contact info required</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </FormField>
            </div>
        </div>
    )
}