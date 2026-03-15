import React from 'react';

interface SearchButtonProps {
  username: string;
}

const SearchButton: React.FC<SearchButtonProps> = ({ username }) => {
  const handleClick = () => {
    const searchUrl = `https://arctic-shift.photon-reddit.com/search?fun=posts_search&author=${username}&limit=10&sort=desc`;
    window.location.href = searchUrl;
  };

  return (
    <button
      onClick={handleClick}
      style={{
        marginTop: '12px',
        padding: '8px 16px',
        backgroundColor: '#0079D3',
        color: 'white',
        border: 'none',
        borderRadius: '20px',
        cursor: 'pointer',
        fontWeight: 'bold'
      }}
    >
      Search Post History on Arctic Shift
    </button>
  );
};

export default SearchButton;