// Get user profile [Get '/']
export const getUserProfile = async (req, res)=>{
    try {
        const role = req.user.role
        const cartData = req.user.cartData
        return res.json({success:true, role, cartData})
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            message: "Unable to load user profile",
        })
    }
}
